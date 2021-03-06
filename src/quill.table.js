// quill-table-breaks.js

let Container = Quill.import('blots/container');
let Scroll = Quill.import('blots/scroll');
let Inline = Quill.import('blots/inline');
let Block = Quill.import('blots/block');
let Delta = Quill.import('delta');
let Parchment = Quill.import('parchment');
let BlockEmbed = Quill.import('blots/block/embed');
let TextBlot = Quill.import('blots/text');

class ContainBlot extends Container {
  static create(value) {
    let tagName = 'contain';
    let node = super.create(tagName);
    return node;
  }

  insertBefore(blot, ref) {
    if (blot.statics.blotName == this.statics.blotName) {
      console.log('############################ Not sure this is clean:')
      console.log(blot)
      console.log(blot.children.head)
      super.insertBefore(blot.children.head, ref);
    } else {
      super.insertBefore(blot, ref);
    }
  }

  static formats(domNode) {
    return domNode.tagName;
  }

  formats() {
    // We don't inherit from FormatBlot
    return { [this.statics.blotName]: this.statics.formats(this.domNode) }
  }

  replace(target) {
    if (target.statics.blotName !== this.statics.blotName) {
      let item = Parchment.create(this.statics.defaultChild);
      target.moveChildren(item);
      this.appendChild(item);
    }
    if (target.parent == null) return;
    super.replace(target)
  }
}

ContainBlot.blotName = 'contain';
ContainBlot.tagName = 'contain';
ContainBlot.scope = Parchment.Scope.BLOCK_BLOT;
ContainBlot.defaultChild = 'block';
ContainBlot.allowedChildren = [Block, BlockEmbed, Container];
Quill.register(ContainBlot);

class TableRow extends Container {
  static create(value) {
    let tagName = 'tr';
    let node = super.create(tagName);
    return node;
  }

  optimize() {
    super.optimize();
    var parent = this.parent
    if (parent != null && parent.statics.blotName != 'table') {
      this.processTable()
    }
  }

  processTable () {
    var currentBlot = this
    var rows = []
    while (currentBlot) {
      if (! (currentBlot instanceof TableRow)) {
        break
      }
      rows.push(currentBlot)
      currentBlot = currentBlot.next
    }    
    let mark = Parchment.create('block');
    this.parent.insertBefore(mark, this.next);
    let table = Parchment.create('table');    
    rows.forEach(function (row) {
      table.appendChild(row)
    })
    table.replace(mark)
  }
}

TableRow.blotName = 'tr';
TableRow.tagName = 'tr';
TableRow.scope = Parchment.Scope.BLOCK_BLOT;
TableRow.defaultChild = 'td';
Quill.register(TableRow);

class Table extends Container {
  optimize() {
    super.optimize();
    let next = this.next;
    if (next != null && next.prev === this &&
        next.statics.blotName === this.statics.blotName &&
        next.domNode.tagName === this.domNode.tagName 
        ) {
      next.moveChildren(this);
      next.remove();
    }
  }
}

Table.blotName = 'table';
Table.tagName = 'table';
Table.scope = Parchment.Scope.BLOCK_BLOT;
Table.defaultChild = 'tr';
Table.allowedChildren = [TableRow];
Quill.register(Table);

//
//
// CONTAINER TD
//

class TableCell extends ContainBlot {

  format() {
    return 'td'
  }

  optimize() {
    super.optimize();
    let parent = this.parent;
    if (parent != null && parent.statics.blotName != 'tr') {
      this.processTR()
    }
    // merge same TD id
    let next = this.next;
    if (next != null && next.prev === this &&
        next.statics.blotName === this.statics.blotName &&
        next.domNode.tagName === this.domNode.tagName 
        ) {
      next.moveChildren(this);
      next.remove();
    }
  }
  processTR () {
    // find next row break
    var currentBlot = this
    var rowItems = [this]
    while (currentBlot) {
      if (currentBlot.statics.tagName !== 'TD') {
        break
      }
      rowItems.push(currentBlot)
      if (currentBlot instanceof RowBreak) {
        break
      }
      currentBlot = currentBlot.next
    }
    // create row, add row items as TDs
    var prevItem
    var cellItems = []
    var cells = []
    rowItems.forEach(function (rowItem) {
      cellItems.push(rowItem)
      if (rowItem instanceof TableCell) {
        prevItem = rowItem
      } else if (rowItem instanceof CellBreak) {
        cells.push(cellItems)
        cellItems = []
      }       
    })
    if (cellItems.length > 0) {
      cells.push(cellItems)
    }
    let mark = Parchment.create('block');
    this.parent.insertBefore(mark, this.next);
    // create row
    var row = Parchment.create('tr')
    cells.forEach(function (cell) {
    // add row elements
      cell.forEach(function (cellItem) {
        row.appendChild(cellItem)
      }) 
    })
    row.replace(mark)
  }
}


TableCell.blotName = 'td';
TableCell.tagName = 'td';
TableCell.scope = Parchment.Scope.BLOCK_BLOT;
TableCell.defaultChild = 'block';
TableCell.allowedChildren = [Block, BlockEmbed, Container];
Quill.register(TableCell);


Container.order = [
  'list', 'contain',   // Must be lower
  'td', 'tr', 'table'  // Must be higher
];

class RowBreak extends BlockEmbed {
  formats() {
        return { trbr: true }
  }    
}
RowBreak.blotName = 'trbr'
RowBreak.tagName = 'td'
RowBreak.className = 'trbr'

Quill.register(RowBreak);

class CellBreak extends BlockEmbed {
  formats() {
        return { tdbr: true }
  }   
}
CellBreak.blotName = 'tdbr'
CellBreak.tagName = 'td'
CellBreak.className = 'tdbr'
Quill.register(CellBreak);

// END quill-table-breaks.js



// Render UI
var Keyboard = Quill.import('modules/keyboard')

// set up toolbar options
let maxRows = 10;
let maxCols = 5;
let tableOptions = [];
for (let r = 1; r <= maxRows; r++) {
  for (let c = 1; c <= maxCols; c++) {
    tableOptions.push('newtable_' + r + '_' + c);
  }
}

Quill.debug('debug');
var quill = new Quill('#editor-container', {
  modules: {
    toolbar: {
      container: [
        [{ 'table': tableOptions }], // new table (cursor needs to be out of table)
        ['table-insert-rows'], // cursor needs to be in the table
        ['table-insert-columns'], // cursor needs to be in the table

        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],

        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],

        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],

        ['link', 'image', 'code-block'],

        ['clean']
      ],
      handlers: {
    
      }
    },
    clipboard: {
      matchers: [
        ['TD, TH', function (node, delta) {
          delta.insert("\n", { td: true })
          delta.insert({ tdbr: true })
          return delta
        }],
        ['TR', function (node, delta) {
          delta.insert({ trbr: true })
          return delta
        }],        
      ]
    },    
    keyboard: {
      bindings: {
        'backspaceTable': {
            key: 8,
            format: ['td'],
            // offset: 0,
            handler: function handleTableBackspace (range, context) {
              var formats = quill.getFormat(range.index-1, 1)
              if (formats.tdbr || formats.trbr) {
                // prevent deletion of table break
                return false 
              }
              return true
            }  
        }      
      }
    },
  },
  placeholder: 'Compose an epic...',
  theme: 'snow'  // or 'bubble'
});





function getClosestNewLineIndex (contents, index) {
  return index + contents.map((op) => {
    return typeof op.insert === 'string' ? op.insert : ' '
  }).join('')
    .slice(index)
    .indexOf('\n')
}

function find_td(what) {
    let leaf = quill.getLeaf(quill.getSelection()['index']);
    let blot = leaf[0];
    for(;blot!=null && blot.statics.blotName!=what;) {
      blot=blot.parent;
    }
    return blot; // return TD or NULL
}




