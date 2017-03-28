# Quill Paste Handler

Custom module for Quill.js](https://github.com/quilljs/quill) to allow user to change url format, to set nested list items as quill format and to handle table format when copy and paste from their file system, ms word and google docs into the editor

## Depedency
[quilljs-table](https://github.com/dost/quilljs-table)

## Usage
### Webpack/ES6

```javascript
const toolbarOptions = {
                        container: [
                            ['bold', 'italic', 'underline', 'strike'],
                            ['emoji'],   
                        ],
                        handlers: {'emoji': function() {}}
                        }
const quill = new Quill(editor, {
    // ...
    modules: {
        // ...
        toolbar: toolbarOptions,
        pasteHandler: true,
    }
});
```

## Contributing

Please check out our [contributing guidelines](CONTRIBUTING.md).