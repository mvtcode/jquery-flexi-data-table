(function( $ ){
  const prefixFunction = 'tdac';

  const VfType = {
    DATA: "DATA",
    SYMBOL: 'SYMBOL',
    ACTION: 'ACTION',
    ICON: 'ICON',
  };

  const symbols = [
    {
      vfTitle: '⌴',
      vfCode: 'space',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'space',
      vfActualFieldTitle: 'Dấu cách',
      value: '&nbsp;',
    },
    {
      vfTitle: '↩',
      vfCode: 'newline',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'newline',
      vfActualFieldTitle: 'NewLine',
      value: '<br/>',
    },
    {
      vfTitle: '-',
      vfCode: 'minus',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'minus',
      vfActualFieldTitle: 'Dấu trừ',
      value: '&hyphen;',
    },
    {
      vfTitle: '|',
      vfCode: 'vertical',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'vertical',
      vfActualFieldTitle: 'Dấu dọc',
      value: '|',
    },
    {
      vfTitle: ',',
      vfCode: 'comma',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'comma',
      vfActualFieldTitle: 'Dấu phẩy',
      value: ',',
    },
    {
      vfTitle: '.',
      vfCode: 'dot',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'dot',
      vfActualFieldTitle: 'Dấu chấm',
      value: '.',
    },
    {
      vfTitle: ';',
      vfCode: 'semicolon',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'semicolon',
      vfActualFieldTitle: 'Chấm phẩy',
      value: ';',
    },
    {
      vfTitle: '[',
      vfCode: 'openBracket',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'openBracket',
      vfActualFieldTitle: 'Mở ngoặc vuông',
      value: '[',
    },
    {
      vfTitle: ']',
      vfCode: 'closeBracket',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'closeBracket',
      vfActualFieldTitle: 'Đóng ngoặc vuông',
      value: ']',
    },
    {
      vfTitle: '(',
      vfCode: 'openRoundBracket',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'openRoundBracket',
      vfActualFieldTitle: 'Mở ngoặc tròn',
      value: '(',
    },
    {
      vfTitle: ')',
      vfCode: 'closeRoundBracket',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'closeRoundBracket',
      vfActualFieldTitle: 'Đóng hoặc tròn',
      value: ')',
    },
  ];

  function flattenObject(obj = {}, parentKey = '', result = {}) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const prefixedKey = parentKey ? `${parentKey}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          flattenObject(obj[key], prefixedKey, result);
        } else {
          result[prefixedKey] = obj[key];
        }
      }
    }
    return result;
  }

  const render = (template, values = {}) => {
    return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const value = values[key];
      return (value !== undefined && value !== null) ? value : match;
    });
  }

  const escapeHTML = str => (str+'').replace(/[&<>"'`=\/]/g, s => ({'&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;','/': '&#x2F;','`': '&#x60;','=': '&#x3D;'})[s]);

  const toJson = (value) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }

  function moveArrayElement(arr, oldIndex, newIndex) {
    const elementToMove = arr.splice(oldIndex, 1)[0];
    arr.splice(newIndex, 0, elementToMove);
    return arr;
  }

  /*
    columns: Column[];
    templates: VfField[];
    data: any[];
    height: number;
    fixed: boolean;
  */
  $.fn.flexiTable = function({ columns = [], templates = [], data = [], height = 300, fixed = false, onCta }) {
    const div = $(this);
    div.addClass('wrapper-table').addClass('custom-scroll');
    if (fixed) {
      div.addClass('fixed');
      div.css({height: `${height}px`})
    }

    const callFunction = `${prefixFunction}${Math.floor(Math.random() * 1e6)}`;
    window[callFunction] = function (action, index) {
      if (onCta) {
        const row = data[index];
        onCta(action, row, index);
      }
    }

    const mapFieldInfo = [...templates, ...symbols].reduce((map, field) => {
      map[field.vfCode] = field;
      return map;
    }, {});

    const getValue = (row = {}, column, index, mapFieldInfo = {}) => {
      const values = [];
      for(const vfCode of column.fieldCodes) {
        const fieldInfo = mapFieldInfo[vfCode];
        if (fieldInfo) {
          if (fieldInfo.vfType === VfType.SYMBOL) {
            values.push(fieldInfo?.value || '');
            continue;
          }
  
          if (fieldInfo.vfType === VfType.ACTION) {
            const value = `<span class="btn btn-${fieldInfo.vfAcutalField}" onClick="${callFunction}('${fieldInfo.vfCode}', ${index})">${fieldInfo?.vfTitle || ''}</span>`;
            values.push(value);
            continue;
          }
  
          if (fieldInfo.vfType === VfType.ICON) {
            const value = `<img class="icon" src="${fieldInfo.value}"/>`;
            values.push(value);
            continue;
          }
  
          if (fieldInfo.vfRenderFunc) {
            const vFun = fieldInfo.vfRenderFunc(row, fieldInfo, index, callFunction);
            values.push(vFun);
            continue;
          }
  
          const rowValue = row[fieldInfo.vfAcutalField];
          if(Array.isArray(rowValue)) {
            const vArr = fieldInfo.templateShow ? rowValue.map((item) => render(fieldInfo.templateShow, {$item: escapeHTML(item)})).join('') : rowValue.join(', ');
            values.push(vArr);
            continue;
          }
  
          const objectRow = flattenObject(row);
          let value = objectRow[fieldInfo?.vfAcutalField || ''];
          if (fieldInfo?.enum && Object.keys(fieldInfo.enum).length > 0) {
            value = fieldInfo.enum[value] || value;
            value = escapeHTML(value);
          }
  
          if (fieldInfo?.templateShow) {
            value = render(fieldInfo?.templateShow, {value: escapeHTML(value)});
          }
  
          values.push(value);
        }
      }
      return values.join('');
    }

    function Flexi() {
      const table = $('<table class="dynamic-table"></table>');
      div.append(table);
      this.table = table;

      this.data = data;
      this.columns = columns;
      this.templates = templates;
    }

    Flexi.prototype.drawHeader = function() {
      const thead = $('<thead></thead>')
      const tr = $('<tr></tr>');
  
      for(const column of this.columns) {
        const th = $(`<th> ${column.title} </th>`);
        tr.append(th);
      }
  
      thead.append(tr);
      this.table.append(thead);
      return this;
    };

    Flexi.prototype.drawBody = function() {
      const body = $('<tbody></tbody>')
  
      for (const [index, row] of this.data.entries()) {
        const tr = $('<tr></tr>');
        for(const column of this.columns) {
          const td = $(`<td></td>`);
          const div = $('<div class="td-line"></div>');
          div.html(getValue(row, column, index, mapFieldInfo));
          td.append(div);
          tr.append(td);
          
          td.css('text-align', column.align || 'left');
          td.css('vertical-align', column.vAlign || 'top');
          column.width && td.css('width', column.width);
          column.minWidth && td.css('min-width', column.minWidth);
          column.maxWidth && td.css('max-width', column.maxWidth);
        }
        body.append(tr);
      }
  
      this.table.append(body);
      return this;
    };

    Flexi.prototype.setTemplate = function (templates) {
      this.templates = templates;
      return this;
    }

    Flexi.prototype.setColumns = function (columns) {
      this.columns = columns;
      return this;
    }

    Flexi.prototype.setData = function (data) {
      this.data = data;
      return this;
    }

    Flexi.prototype.reload = function () {
      this.table.empty();
      this.drawHeader();
      this.drawBody();
      return this;
    }

    const flexi = new Flexi();
    flexi.drawHeader();
    flexi.drawBody();
    return flexi;
  };

  /*
    columns: Column[];
    vfFields: VfField[];
    actions: VfField[];
    icons: VfField[];
    height?: number;
    disabled?: boolean;
  */
  $.fn.flexiTableEdit = function({columns = [], vfFields = [], actions = [], icons = [], height = 390}) {
    const div = $(this);
    div.addClass('dynamic-table-edit').addClass('box').addClass('box-grid');
    div.css({height: `${height}px`});

    const divContent = $('<div class="grid-col-2"></div>');
    div.append(divContent);

    // other
    divContent.append(`
      <div class="edit-columns">
        <div class="justify-content-space-between">
          <h5> Columns </h5>
          <div>
            <button class="btn-plus" :disabled="disabled" @click="onAddColumn">✚</button>
          </div>
        </div>
        <hr style="margin: 5px 0"/>
        <ul class="dragArea list-group custom-scroll list-columns">
        </ul>
      </div>

      <div class="edit-columns">
        <h5>Fields</h5>
        <hr style="margin: 5px 0"/>
          <ul class="list-field custom-scroll list-fields">
            <!--
              <li v-for="field in listFields" :key="field.field">
                <div class="label">{{ field.title }}:</div>
                <div class="item" draggable="true" @dragstart="e => onDragstart(e, vfield)" v-for="vfield in field.variants" :key="vfield.vfCode"> {{ vfield.vfTitle }} </div>
              </li>
            -->
          </ul>
      </div>

      <div class="edit-columns etc-field custom-scroll">
        <div>
          <h5>Separator</h5>
          <hr style="margin: 5px 0"/>
          <ul class="list-field-symbol list-separators">
            <!--
              <li v-for="field in symbols" :key="field.vfAcutalField">
                <div class="item" draggable="true" @dragstart="e => onDragstart(e, field)"> {{ field.vfTitle }} </div>
              </li>
            -->
          </ul>
        </div>

        <div style="margin-top: 10px">
          <h5>Actions</h5>
          <hr style="margin: 5px 0"/>
          <ul class="list-field-symbol list-actions">
            <!--
              <li v-for="field in actions" :key="field.vfAcutalField">
                <div class="item btn" draggable="true" @dragstart="e => onDragstart(e, field)"> {{ field.vfTitle }} </div>
              </li>
            -->
          </ul>
        </div>
        
        <div style="margin-top: 10px">
          <h5>Icons</h5>
          <hr style="margin: 5px 0"/>
          <ul class="list-field-symbol list-icons">
            <!--
              <li v-for="field in icons" :key="field.vfAcutalField">
                <img :src="field.value" class="icon" draggable="true" @dragstart="e => onDragstart(e, field)"/>
              </li>
            -->
          </ul>
        </div>
      </div>
    `);

    function Edit() {
      this.columns = columns;
      this.vfFields = vfFields;
      this.disabled = false;
      // this.onChange = null;
      this.mapFunction = {}; // {[event: string]: Function[]};
      this.currentRow = -1;

      this.btnPlus = divContent.find('.btn-plus');
      this.listColumns = divContent.find('.list-columns');
      this.listFields = divContent.find('.list-fields');
      this.listSeparator = divContent.find('.list-separators');
      this.listActions = divContent.find('.list-actions');
      this.listIcons = divContent.find('.list-icons');

      for(const symbol of symbols) {
        const li = $('<li></li>');
        const div = $(`<div class="item" draggable="true"> ${symbol.vfTitle} </div>`);
        li.append(div);
        this.listSeparator.append(li);

        div.on('dragstart', (e) => {
          this.onDragstart(e, symbol);
        });
      }

      for(const action of actions) {
        const li = $('<li></li>');
        const div = $(`<div class="item btn" draggable="true"> ${action.vfTitle} </div>`);
        li.append(div);
        this.listActions.append(li);

        div.on('dragstart', (e) => {
          this.onDragstart(e, action);
        });
      }

      for(const icon of icons) {
        const li = $('<li></li>');
        const div = $(`<img src="${icon.value}" class="icon" draggable="true" />`);
        li.append(div);
        this.listIcons.append(li);

        div.on('dragstart', (e) => {
          this.onDragstart(e, icon);
        });
      }

      this.mapFieldInfo = [...vfFields, ...icons, ...actions, ...symbols].reduce((map, field) => {
        map[field.vfCode] = field;
        return map;
      }, {});

      this.drawVfFields();
      this.drawColumns();

      this.btnPlus.click(() => {
        this.addColumn();
      });

      const sortable = this.listColumns.sortable({
        handle: '.handle',
        // invertSwap: true,
        onEnd: (e => {
          this.columns = moveArrayElement(this.columns, e.oldIndex, e.newIndex);
          this.emit('change');
        }),
      });

      return this;
    };

    Edit.prototype.drawVfFields = function () {
      const mapField = {};
      const list = [];

      for(const vfField of this.vfFields) {
        const vfAcutalField = vfField?.vfAcutalField || '';
        if (mapField[vfAcutalField] === undefined) {
          list.push({
            title: vfField.vfActualFieldTitle || '',
            field: vfAcutalField,
            variants: [vfField],
          });
    
          mapField[vfAcutalField] = list.length - 1;
        } else {
          list[mapField[vfAcutalField]].variants.push(vfField);
        }
      }

      for(const field of list) {
        const li = $('<li></li>');
        const label = $(`<div class="label"> ${field.title}:</div>`);
        li.append(label);

        for(const vfield of field.variants) {
          const item = $(`<div class="item" draggable="true"> ${vfield.vfTitle} </div>`);
          li.append(item);
          
          item.on('dragstart', (e) => {
            this.onDragstart(e, vfield);
          });
        }

        this.listFields.append(li);
      }
    }

    Edit.prototype.drawColumns = function () {
      const self = this;

      for(const column of self.columns) {
        self._addRow(column);
      }
    }

    Edit.prototype.addEventListener = function (event, callback) {
      if (this.mapFunction[event] === undefined) {
        this.mapFunction[event] = [];
      }

      this.mapFunction[event].push(callback);
    }

    Edit.prototype.emit = function (event) {
      const listFunction = this.mapFunction[event];
      if (listFunction && listFunction.length > 0) {
        for(const func of listFunction) {
          func(this.columns);
        }
      }
    }

    Edit.prototype._addRow = function (column) {
      const self = this;
      const li = $(`
        <li class="list-group-item">
          <div class="label align-items-center drop-zone">
            <div class="align-items-center">
              <span class="handle">☰</span>
              <div class="inline-block popper-wrapper">
                <button class="btn-more btn-popover">⋯</button>
                <div class="popover-action popover-content">
                  <div>
                    <button class="btn-more btn-align-left">
                      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTcgMTBIM00yMSA2SDNNMjEgMTRIM00xNyAxOEgzIi8+PC9zdmc+" />
                    </button>
                    <button class="btn-more btn-align-center">
                      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiI+PHBhdGggZD0iTTEyIDI4aDcyYTQgNCAwIDAgMCAwLThIMTJhNCA0IDAgMCAwIDAgOHptOCA4YTQgNCAwIDAgMCAwIDhoNTZhNCA0IDAgMCAwIDAtOEgyMHptNjQgMTZIMTJhNCA0IDAgMCAwIDAgOGg3MmE0IDQgMCAwIDAgMC04em0tOCAxNkgyMGE0IDQgMCAwIDAgMCA4aDU2YTQgNCAwIDAgMCAwLTh6Ii8+PC9zdmc+" />
                    </button>
                    <button class="btn-more btn-align-right">
                      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiI+PHBhdGggZD0iTTg4IDI0YTQgNCAwIDAgMC00LTRIMTJhNCA0IDAgMCAwIDAgOGg3MmE0IDQgMCAwIDAgNC00em0wIDE2YTQgNCAwIDAgMC00LTRIMjhhNCA0IDAgMCAwIDAgOGg1NmE0IDQgMCAwIDAgNC00ek04IDU2YTQgNCAwIDAgMCA0IDRoNzJhNCA0IDAgMCAwIDAtOEgxMmE0IDQgMCAwIDAtNCA0em0xNiAxNmE0IDQgMCAwIDAgNCA0aDU2YTQgNCAwIDAgMCAwLThIMjhhNCA0IDAgMCAwLTQgNHoiLz48L3N2Zz4=" />
                    </button>
                  </div>
                  <div style="margin-top: 4px">
                    <button class="btn-more btn-valign-top">
                      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOCAxMWgzdjEwaDJWMTFoM2wtNC00LTQgNHpNNCAzdjJoMTZWM0g0eiIvPjwvc3ZnPg==" />
                    </button>
                    <button class="btn-more btn-valign-middle">
                      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOCAxOWgzdjRoMnYtNGgzbC00LTQtNCA0em04LTE0aC0zVjFoLTJ2NEg4bDQgNCA0LTR6TTQgMTF2MmgxNnYtMkg0eiIvPjwvc3ZnPg==" />
                    </button>
                    <button class="btn-more btn-valign-bottom">
                      <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTYgMTNoLTNWM2gtMnYxMEg4bDQgNCA0LTR6TTQgMTl2MmgxNnYtMkg0eiIvPjwvc3ZnPg==" />
                    </button>
                  </div>
                  <div style="margin-top: 4px" class="div-input">
                    <label class="label">width:</label> <input type="text" class="txt-width" placeholder="# px | %"/>
                  </div>
                  <div style="margin-top: 4px" class="div-input">
                    <label class="label">min-width:</label> <input type="text" class="min-width" placeholder="# px | %"/>
                  </div>
                  <div style="margin-top: 4px" class="div-input">
                    <label class="label">max-width:</label> <input type="text" class="max-width" placeholder="# px | %"/>
                  </div>
                  <div class="popper-arrow"></div>
                </div>
              </div>
              
              <input class="input-title" type="text" placeholder="Column name"/>
            </div>
            <ul class="list-selected-field">
              <!--
              <li v-for="vfCode in element.fieldCodes" :key="vfCode">
                <img v-if="mapFieldInfo[vfCode]?.vfType === VfType.ICON" class="icon-selected":src="mapFieldInfo[vfCode]?.value" />
                <span v-else>{{ mapFieldInfo[vfCode]?.vfTitle }}</span>
              </li>
              <li class="no-data">Kéo field vào đây</li>
              -->
            </ul>
          </div>
          <div>
            <button class="btn btn-close" @click.stop="closeIndex(index)" :disabled="disabled">
              ✘
            </button>
          </div>
        </li>
      `);

      self.listColumns.append(li);

      const dropZone = li.find('.drop-zone');
      const inputTitle = li.find('.input-title');
      const listFields = li.find('.list-selected-field');
      const btnClose = li.find('.btn-close');

      const btnPopover = li.find('.btn-popover');
      const contentPopover = li.find('.popover-content');
      btnPopover.webuiPopover({
        url: contentPopover,
        trigger:'click',
        placement: 'right',
      });
      contentPopover.click(function(e) {
        e.preventDefault();
        return false;
      });

      const btnAlignLeft = li.find('button.btn-align-left');
      const btnAlignCenter = li.find('button.btn-align-center');
      const btnAlignRight = li.find('button.btn-align-right');
      const btnValignTop = li.find('button.btn-valign-top');
      const btnValignMiddle = li.find('button.btn-valign-middle');
      const btnValignBottom = li.find('button.btn-valign-bottom');
      const txtWidth = li.find('.txt-width');
      const txtMinWidth = li.find('.min-width');
      const txtMaxWidth = li.find('.max-width');

      inputTitle.val(column.title);

      switch(column.align || 'left') {
        case 'left':
          btnAlignLeft.addClass('active');
          break;
        case 'center':
          btnAlignCenter.addClass('active');
          break;
        case 'right':
          btnAlignRight.addClass('active');
          break;
      }

      switch(column.vAlign || 'top') {
        case 'top':
          btnValignTop.addClass('active');
          break;
        case 'middle':
          btnValignMiddle.addClass('active');
          break;
        case 'bottom':
          btnValignBottom.addClass('active');
          break;
      }

      column.width && txtWidth.val(column.width);
      column.minWidth && txtMinWidth.val(column.minWidth);
      column.maxWidth && txtMaxWidth.val(column.maxWidth);

      btnPopover.click(function() {
        const btn = $(this);
        const li = btn.parent().parent().parent().parent();
        const index = self.listColumns.find('li.list-group-item').index(li);
        self.currentRow = index;
      });

      btnAlignLeft.click(function() {
        const btn = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].align = 'left';
          btn.parent().find('.active').removeClass('active');
          btn.addClass('active');
          self.emit('change');
        }
      });
      btnAlignCenter.click(function() {
        const btn = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].align = 'center';
          btn.parent().find('.active').removeClass('active');
          btn.addClass('active');
          self.emit('change');
        }
      });
      btnAlignRight.click(function() {
        const btn = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].align = 'right';
          btn.parent().find('.active').removeClass('active');
          btn.addClass('active');
          self.emit('change');
        }
      });

      btnValignTop.click(function() {
        const btn = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].vAlign = 'top';
          btn.parent().find('.active').removeClass('active');
          btn.addClass('active');
          self.emit('change');
        }
      });
      btnValignMiddle.click(function() {
        const btn = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].vAlign = 'middle';
          btn.parent().find('.active').removeClass('active');
          btn.addClass('active');
          self.emit('change');
        }
      });
      btnValignBottom.click(function() {
        const btn = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].vAlign = 'bottom';
          btn.parent().find('.active').removeClass('active');
          btn.addClass('active');
          self.emit('change');
        }
      });

      txtWidth.change(function() {
        const txt = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].width = txt.val();
          self.emit('change');
        }
      });

      txtMinWidth.change(function() {
        const txt = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].minWidth = txt.val();
          self.emit('change');
        }
      });
      
      txtMaxWidth.change(function() {
        const txt = $(this);
        if(self.currentRow >= -1 && self.columns[self.currentRow]) {
          self.columns[self.currentRow].maxWidth = txt.val();
          self.emit('change');
        }
      });

      const addItemToFields = (vfCode) => {
        const fieldInfo = self.mapFieldInfo[vfCode];
        if (fieldInfo) {
          return fieldInfo.vfType === VfType.ICON ? `<img class="icon-selected" src="${fieldInfo.value}" />` : `<span>${ fieldInfo.vfTitle }</span>`;
        }
        return '';
      }

      if (column.fieldCodes.length > 0) {
        listFields.empty();
        for(const vfCode of column.fieldCodes) {
          const contentLi = addItemToFields(vfCode);
          contentLi && listFields.append(`<li>${contentLi}</li>`);
        }
      } else {
        listFields.append(`<li class="no-data">Kéo field vào đây</li>`);
      }

      dropZone.on('drop', function(e) {
        if (self.disabled) {
          return false;
        }
        e.preventDefault();
        const div = $(this);
        div.parent().removeClass('hover');
        const data = toJson(e.originalEvent.dataTransfer.getData('text'));
        
        if (data && data.vfCode) {
          const li = div.parent();
          const index = self.listColumns.find('li.list-group-item').index(li);
          self.columns[index].fieldCodes.push(data.vfCode);

          const listFields = div.find('.list-selected-field');
          listFields.find('li.no-data').remove();
          const contentLi = addItemToFields(data.vfCode);
          contentLi && listFields.append(`<li>${contentLi}</li>`);

          self.emit('change');
        }
      });

      dropZone.on('dragover', function(e) {
        if (self.disabled) {
          return false;
        }
        e.preventDefault();
        $(this).parent().addClass('hover');
      });

      dropZone.on('dragleave', function(e) {
        $(this).parent().removeClass('hover');
      });

      inputTitle.change(function () {
        const input = $(this);
        const li = input.parent().parent().parent();
        const index = self.listColumns.find('li.list-group-item').index(li);
        self.columns[index].title = input.val();
        self.emit('change');
      });

      btnClose.click(function() {
        const btn = $(this);
        const li = btn.parent().parent();
        const index = self.listColumns.find('li.list-group-item').index(li);
        if (self.columns[index].fieldCodes.length > 0) {
          self.columns[index].fieldCodes.length = 0;
          div.find('.list-selected-field').empty().append(`<li class="no-data">Kéo field vào đây</li>`);
        } else {
          self.columns.splice(index, 1);
          self.listColumns.find('li.list-group-item').eq(index).remove();
        }
        this.emit('change');
      });
    }

    Edit.prototype.addColumn = function () {
      const newColumn = {
        title: "",
        fieldCodes: []
      };

      this.columns.push(newColumn);
      this.emit('change');

      this._addRow(newColumn);
    }

    Edit.prototype.onDragstart = function (e, field) {
      e.originalEvent.dataTransfer.setData("text", JSON.stringify(field));
    }

    Edit.prototype.setColumns = function (columns) {
      this.columns = columns;
      this.listColumns.empty();
      this.drawColumns();
    }

    const edit = new Edit();
    return edit;
  };

  /*
    vfFields: VfField[];
    actions: VfField[];
    icons: VfField[];
    height?: number;
    disabled?: boolean;
    isShowLayout?: boolean;
    isShowOption?: boolean;
    layouts: [{
      title: string;
      id: UUID;
      isSystem: boolean;
      columns: Column[];
    }]
  */
  $.fn.flexiTableFull = function({data = [], vfFields = [], actions = [], icons = [], tableHeight = 300, tableFixed = false, editHeight = 390, layouts = [], isShowLayout = true, isShowOption = true, onCta, onDeleteLayout, onSaveLayout, onSetDefaultLayout}) {
    const containers = $(this);
    containers.addClass('flexi-table-full');

    function TableFull() {
      this.layouts = layouts;
      this.data = data;

      this.objEdit = {
        tablePreview: null,
        tableEdit: null,
        layoutsEdit: [],
        popupEdit: null,
        ddlLayoutEdit: null,
        btnClone: null,
        btnDelete: null,
        btnSave: null,
        btnDefault: null,
        btnCopy: null,
      };

      this.layoutId = layouts?.length > 0 ? layouts[0].id : '';
      this.layoutIndex = 0;
      this.ddl = null;
      this.btnOption = null;
      this.objTableMain = null;

      this.drawHeader();
      this.drawTable();
    };

    TableFull.prototype.drawHeader = function () {
      const self = this;
      if (isShowLayout || isShowOption) {
        const divHeader = $('<div class="justify-content-space-between" style="margin-bottom: 8px;"></div>');
        const divLeft = $('<div class="align-items-center"></div>');
        divHeader.append(divLeft);
  
        if (isShowLayout) {
          divLeft.append('<h4>Layout:</h4>');
          const ddl = $('<select class="select-layout" placeholder="Chọn layout"></select>');
          divLeft.append(ddl);
          self.ddl =ddl;
  
          if (self.layouts.length > 0) {
            for(const layout of self.layouts) {
              ddl.append(`<option value="${layout.id}">${layout.title}</option>`);
            }
          }

          ddl.change(function() {
            const value = $(this).val();
            self.changeLayout(value);
          });
        }
  
        if (isShowOption) {
          const btnOptopn = $('<button class="btn-option">🛠</button>');
          divHeader.append(btnOptopn);
          self.btnOption = btnOptopn;
          self.drawPopup();
          btnOptopn.click(function() {
            self.showPopupEdit();
          });
        }
  
        containers.append(divHeader);
      }
    };

    TableFull.prototype.drawTable = function () {
      const self = this;
      const divTable = $('<div></div>');
      containers.append(divTable);

      self.objTableMain = divTable.flexiTable({
        columns: self.layouts?.length > 0 ? self.layouts[0].columns : [],
        templates: [...vfFields, ...icons, ...actions],
        data,
        height: tableHeight,
        fixed: tableFixed,
        onCta: function (action, row, index) {
          onCta(action, row, index);
        }
      });
    };

    TableFull.prototype.changeLayout = function (layoutId) {
      const index = this.layouts.findIndex(layout => layout.id === layoutId);
      const newColumns = this.layouts[index].columns;
      this.objTableMain.setColumns(newColumns);
      this.objTableMain.reload();
    }

    TableFull.prototype.drawPopup = function () {
      const self = this;
      self.objEdit.popupEdit = $(`
        <div class="popup-edit-wrapper">
          <div class="popup-content">
            <div class="justify-content-space-between" style="margin-bottom: 10px">
              <h3>[Nâng cao] Cấu hình cách hiển thị bảng dữ liệu</h3>
              <button class="btn-close"> ❌ </button>
            </div>

            <div class="table-preview"></div>

            <div class="align-items-center">
              <h4>Tên layout:</h4>
              <select class="select-layout"></select>

              <button class="btn-clone">Clone</button>
              <button class="btn-delete">Xóa</button>
              <button class="btn-save">Lưu</button>
              <button class="btn-default">Default</button>
              <button class="btn-copy">Copy</button>
            </div>

            <div class="table-edit"></div>
          </div>
        </div>
      `);
      containers.after(self.objEdit.popupEdit);

      self.objEdit.popupEdit.find('.btn-close').click(function() {
        self.objEdit.popupEdit.css('display', 'none');
      });

      const tablePreview = self.objEdit.popupEdit.find('.table-preview');
      self.objEdit.ddlLayoutEdit = self.objEdit.popupEdit.find('.select-layout');
      self.objEdit.btnClone = self.objEdit.popupEdit.find('.btn-clone');
      self.objEdit.btnDelete = self.objEdit.popupEdit.find('.btn-delete');
      self.objEdit.btnSave = self.objEdit.popupEdit.find('.btn-save');
      self.objEdit.btnDefault = self.objEdit.popupEdit.find('.btn-default');
      self.objEdit.btnCopy = self.objEdit.popupEdit.find('.btn-copy');
      const tableEdit = self.objEdit.popupEdit.find('.table-edit');

      self.objEdit.tablePreview = tablePreview.flexiTable({
        columns: self.layouts?.length > 0 ? self.layouts[0].columns : [],
        templates: [...vfFields, ...icons, ...actions],
        data: self.data,
        height: 300,
        fixed: true,
        onCta: function (action, row, index) {
          console.log(action, row, index);
        }
      });

      self.objEdit.tableEdit = tableEdit.flexiTableEdit({
        columns: [],
        icons,
        actions,
        vfFields,
        height: editHeight,
      });

      self.objEdit.tableEdit.addEventListener('change', (newColumns) => {
        const index = self.objEdit.ddlLayoutEdit[0].selectedIndex;
        self.objEdit.tablePreview.setColumns(newColumns);
        self.objEdit.tablePreview.reload();

        self.objEdit.layoutsEdit[index].columns = newColumns;
      });

      self.objEdit.ddlLayoutEdit.change(function() {
        const index = this.selectedIndex;
        const newColumns = self.objEdit.layoutsEdit[index].columns;
        self.objEdit.tablePreview.setColumns(newColumns);
        self.objEdit.tablePreview.reload();

        self.objEdit.tableEdit.setColumns(newColumns);

        self.objEdit.btnDelete.attr('disabled', self.objEdit.layoutsEdit[index].isSystem);
        self.objEdit.btnSave.attr('disabled', self.objEdit.layoutsEdit[index].isSystem);
        self.objEdit.btnCopy.attr('disabled', self.objEdit.layoutsEdit[index].isSystem);
        self.objEdit.btnDefault.attr('disabled', !self.objEdit.layoutsEdit[index].id);
      });

      self.objEdit.btnClone.click(() => {
        const index = self.objEdit.ddlLayoutEdit[0].selectedIndex;
        const layout = self.objEdit.layoutsEdit[index];
        const newLayout = {
          title: `${layout.title} clone`,
          id: '',
          isSystem: false,
          isDefault: false,
          columns: JSON.parse(
            JSON.stringify(self.objEdit.layoutsEdit[index].columns)
          ),
        }
        self.objEdit.layoutsEdit.push(newLayout);
        self.objEdit.ddlLayoutEdit.append(`<option value="${newLayout.id}">${newLayout.title}</option>`);
        self.objEdit.ddlLayoutEdit[0].selectedIndex = self.objEdit.layoutsEdit.length - 1;
        self.objEdit.ddlLayoutEdit.trigger('change');
      });

      self.objEdit.btnDelete.click(() => {
        if(confirm('Bạn muốn xóa layout này không?')) {
          const index = self.objEdit.ddlLayoutEdit[0].selectedIndex;

          const delUI = () => {
            self.objEdit.layoutsEdit.splice(index, 1);
            self.objEdit.ddlLayoutEdit.find('option').eq(index).remove();
            self.objEdit.ddlLayoutEdit.trigger('change');
          }
          
          if (!!self.objEdit.layoutsEdit[index].id && onDeleteLayout) {
            onDeleteLayout(self.objEdit.layoutsEdit[index], () => {
              delUI();
            });
          } else {
            delUI();
          }
        }
      });

      self.objEdit.btnSave.click(() => {
        const index = self.objEdit.ddlLayoutEdit[0].selectedIndex;
        if (onSaveLayout) {
          onSaveLayout(self.objEdit.layoutsEdit[index], (id) => {
            self.objEdit.layoutsEdit[index].id = id;
            self.objEdit.ddlLayoutEdit.trigger('change');
          });
        }
      });

      self.objEdit.btnDefault.click(() => {
        const index = self.objEdit.ddlLayoutEdit[0].selectedIndex;
        if (onSetDefaultLayout) {
          onSetDefaultLayout(self.objEdit.layoutsEdit[index]);
        }
      });

      self.objEdit.btnCopy.click(async () => {
        const index = self.objEdit.ddlLayoutEdit[0].selectedIndex;
        try {
          await navigator.clipboard.writeText(JSON.stringify(self.objEdit.layoutsEdit[index].columns));
          console.log('Copied');
        } catch (e) {
          console.error('Copy not support');
        }
      });
    };

    TableFull.prototype.showPopupEdit = function () {
      const self = this;
      self.objEdit.popupEdit?.css('display', 'block');

      self.objEdit.layoutsEdit = JSON.parse(JSON.stringify(self.layouts));
      self.objEdit.ddlLayoutEdit.empty();
      for(const layout of self.objEdit.layoutsEdit) {
        self.objEdit.ddlLayoutEdit.append(`<option value="${layout.id}">${layout.title}</option>`);
      }
      self.objEdit.ddlLayoutEdit.trigger('change');
    };

    return new TableFull();
  }
})( jQuery );