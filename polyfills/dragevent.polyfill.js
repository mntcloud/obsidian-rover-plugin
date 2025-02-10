/* eslint-disable no-undef */

// CREDITS: https://github.com/alexreardon
// This file polyfills DragEvent for jsdom
// https://github.com/jsdom/jsdom/issues/2913
// This file is in JS rather than TS, as our jsdom setup files currently need to be in JS
// Good news: DragEvents are almost the same as MouseEvents

(() => {
  if (typeof window === 'undefined') {
    return;
  }

  // Polyfill not needed

  if (typeof window.DragEvent !== 'undefined') {
    return;
  }

  // Let's create what we need for DragEvent's!

  if (window.DataTransferItemList) {
    throw new Error(`Unexpected global found: "DataTransferItemList"`);
  }

  if (window.DataTransfer) {
    throw new Error(`Unexpected global found: "DataTransfer"`);
  }

  // Using this so we can quickly look up an items
  // data without needing to go through the public async API
  // to get item values
  const fastItemValueLookup = Symbol('item-value');

  /**
   * Note: this polyfill does not implement "read/write", "read-only" or "protected"
   * permissions for `DataTransferItemList` or `DataTransfer`.
   * Adding these permissions in make it impossible to set values like `.types` or `.items`
   * in events other than `"dragstart"`, which we commonly want to be able to set in tests
   *
   * Examples:
   *
   * - You often want to add `.items` for a `"drop"` event (to test you can pull the `.items` out)
   * but `.items` can only be set in `"dragstart"`.
   *
   * - Similarly, you often want to access `.types` in drag events,
   * but they can only be set in `"dragstart"`
   */

  /** @type DataTransferItemList
   *
   * Cheating an making `DataTransferItemList` extend an `Array` so we can get:
   * - `list.length` for free
   * - indexed lookup (`list[0]`) for free
   * - makes other operations such as clearing, finding, adding, removing easy as well
   */
  class DataTransferItemList extends Array {
    /**
     * @param {(string | File)} stringValueOrFile
     * @param {string=} stringMimeType
     * @return {(DataTransferItem | null)}
     * https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransferitemlist-add
     */
    add(stringValueOrFile, stringMimeType) {
      if (stringValueOrFile instanceof File) {
        /** @type DataTransferItem */
        const item = {
          kind: 'file',
          // The type of file being dragged (eg "image/jpeg")
          type: stringValueOrFile.type,
          getAsFile: () => {
            return stringValueOrFile;
          },
          getAsString: (/* callback */) => {
            // callback will never be resolved for files
          },
          webkitGetAsEntry() {
            throw new Error('webkitGetAsEntry() not implemented');
          },
          // This allows us to lookup items synchronously with `dataTransfer.getData()`
          [fastItemValueLookup]: stringValueOrFile,
        };
        this.push(item);
        return item;
      }
      if (typeof stringValueOrFile === 'string') {
        // `type` gets converted to lowercase according to the spec
        const type = stringMimeType.toLocaleLowerCase();
        // Throws if adding data to a type that already has data
        const exists = this.some(
          item => item.kind === 'string' && item.type === type,
        );
        if (exists) {
          throw new DOMException('NotSupportedError');
        }

        /** @type DataTransferItem */
        const item = {
          kind: 'string',
          type,
          getAsFile: () => {
            // this will be `null` for non-files
            return null;
          },
          getAsString: callback => {
            setTimeout(() => {
              callback(stringValueOrFile);
            });
          },
          webkitGetAsEntry() {
            throw new Error('webkitGetAsEntry() not implemented');
          },
          // This allows us to lookup items synchronously with `dataTransfer.getData()`
          [fastItemValueLookup]: stringValueOrFile,
        };
        this.push(item);
        return item;
      }
      throw new Error(
        'Unexpected arguments. Expected: .add(file: File) or .add(data: string, type: string)',
      );
    }

    /** Removes an item at a given index
     * @param {number} index
     * @return {void}
     */
    remove(index) {
      this.splice(index, 1);
    }

    /** Removes all items
     * @return {void}
     */
    clear() {
      this.length = 0;
    }
  }
  window.DataTransferItemList = DataTransferItemList;

  /**
   * @param {string} format
   *
   * Get the full media type, adjusting for shorthand lookup values.
   * https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransfer-getdata
   *
   */
  function getFormat(format) {
    const lower = format.toLocaleLowerCase();

    // shorthands

    if (lower === 'text') {
      return { format: 'text/plain', convertToURL: true };
    }
    // From spec:
    // If format equals "url", change it to "text/uri-list" and set convert-to-URL to true.
    if (lower === 'url') {
      return { format: 'text/uri-list', convertToURL: true };
    }
    return { format: lower, convertToURL: false };
  }

  /**
   * @type DataTransfer
   *
   * https://html.spec.whatwg.org/multipage/dnd.html#the-datatransfer-interface
   */
  class DataTransfer {
    constructor() {
      // From spec:
      // > Set the dropEffect and effectAllowed to "none".
      this.dropEffect = 'none';

      // Not implementing mode restrictions so this can be set in testing
      // for any event
      this.effectAllowed = 'none';

      // DataTransferItemList() is usually a hidden constructor
      this.items = new DataTransferItemList();
    }

    /**
     * Get unique types of `.items`
     * @return {string[]}
     * https://html.spec.whatwg.org/multipage/dnd.html#concept-datatransfer-types
     */
    get types() {
      const all = this.items.map(item => {
        if (item.kind === 'string') {
          return item.type;
        }
        return 'Files';
      });
      // it is possible to have multiple 'Files' entries
      // so we need to strip them out
      const unique = Array.from(new Set(all));
      // sorting for consistency
      return unique.sort();
    }

    /**
     * Get files being dragged
     * @return {FileList}
     */
    get files() {
      return this.items
        .filter(item => item.kind === 'file')
        .reduce((acc, item, index) => {
          const file = item.getAsFile();
          acc[index] = file;
          return acc;
        }, {});
    }

    /** Clears string items. Note: cannot be used to clear files
     *
     * @param {string=} format
     * @return {void}
     * @see https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransfer-cleardata
     */
    clearData(format) {
      if (format) {
        const actualFormat = getFormat(format).format;
        const index = this.items.findIndex(item => {
          // Note: can never clear files with `clearData`
          return item.type === actualFormat;
        });
        if (index !== -1) {
          this.items.remove(index);
        }
        return;
      }

      // According to the spec, `.clearData()` does not remove files.
      // However, in Chrome it does remove files...

      // Looping backwards so that we can safely remove
      // items without messing up indexes
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (item.kind === 'string') {
          this.items.remove(i);
        }
      }
    }

    /** This function is only used to get the value of string items
     *
     * @param {string} format
     * @return {string}
     * @see https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransfer-getdata
     */
    getData(format) {
      const result = getFormat(format);
      const match = this.items.find(
        item => item.kind === 'string' && item.type === result.format,
      );
      if (!match) {
        return '';
      }

      const value = match[fastItemValueLookup];

      if (!result.convertToURL) {
        return value;
      }

      // From spec:
      // If convert-to-URL is true, then parse result as appropriate for text/uri-list data, and then set result to the first URL from the list, if any, or the empty string otherwise. [RFC2483]

      const urls = value
        // You can have multiple urls split by CR+LF (EOL)
        // - CR: Carriage Return '\r'
        // - LF: Line Feed '\n'
        // - EOL: End of Line '\r\n'
        .split('\r\n')
        // a uri-list can have comment lines starting with '#'
        // so we need to remove those
        .filter(piece => !piece.startsWith('#'));

      return urls[0] ?? '';
    }

    /** This function is only used to set string items
     *
     * @param {string} format
     * @param {string} data
     * @return {void}
     * @see https://html.spec.whatwg.org/multipage/dnd.html#dom-datatransfer-setdata
     */
    setData(format, data) {
      const actualFormat = getFormat(format).format;

      // clear existing item with matching format
      this.clearData(actualFormat);

      this.items.add(data, actualFormat);
    }

    // eslint-disable-next-line class-methods-use-this
    setDragImage() {
      // doesn't do anything for our polyfill
    }
  }
  window.DataTransfer = DataTransfer;

  class DragEvent extends MouseEvent {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict);

      // MouseEvent in jsdom doesn't implement the standard pageX and pageY properties
      //this.pageX = eventInitDict.pageX ?? 0;
      //this.pageY = eventInitDict.pageY ?? 0;

      this.dataTransfer = new DataTransfer();
    }
  }

  window.DragEvent = DragEvent;
})();