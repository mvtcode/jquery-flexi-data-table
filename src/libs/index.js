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

  function swapArrayElements(arr, oldIndex, newIndex) {
    const temp = arr[oldIndex];
    arr[oldIndex] = arr[newIndex];
    arr[newIndex] = temp;
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

      this.listColumns.sortable({
        handle: '.handle',
        // invertSwap: true,
        onChange: (e => {
          this.columns = swapArrayElements(this.columns, e.oldIndex, e.newIndex);
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
              <!--<Popper placement="right-start" arrow class="popper-wrapper">-->
                <button class="btn-more" :disabled="disabled">⋯</button>
                <template #content>
                  <div class="popover-action">
                    <div>
                      <button class="btn-more" :class="{active: (element.align || 'left') === 'left'}" @click="element.align = 'left'">
                        <img :src="AlignLeftIcon" />
                      </button>
                      <button class="btn-more" :class="{active: element.align === 'center'}" @click="element.align = 'center'">
                        <img :src="AlignCenterIcon" />
                      </button>
                      <button class="btn-more" :class="{active: element.align === 'right'}" @click="element.align = 'right'">
                        <img :src="AlignRightIcon" />
                      </button>
                    </div>
                    <div style="margin-top: 4px">
                      <button class="btn-more" :class="{active: element.vAlign === 'top'}" @click="element.vAlign = 'top'">
                        <img :src="VerticalAlignTopIcon" />
                      </button>
                      <button class="btn-more" :class="{active: (element.vAlign || 'middle') === 'middle'}" @click="element.vAlign = 'middle'">
                        <img :src="VerticalAlignCenterIcon" />
                      </button>
                      <button class="btn-more" :class="{active: element.vAlign === 'bottom'}" @click="element.vAlign = 'bottom'">
                        <img :src="VerticalAlignBottomIcon" />
                      </button>
                    </div>

                    <div style="margin-top: 4px" class="div-input">
                      <label class="label">width:</label> <input type="text" v-model="element.width" placeholder="# px | %"/>
                    </div>
                    <div style="margin-top: 4px" class="div-input">
                      <label class="label">min-width:</label> <input type="text" v-model="element.minWidth" placeholder="# px | %"/>
                    </div>
                    <div style="margin-top: 4px" class="div-input">
                      <label class="label">max-width:</label> <input type="text" v-model="element.maxWidth" placeholder="# px | %"/>
                    </div>
                  </div>
                  <div></div>
                </template>
              <!--</Popper>-->
              
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

      inputTitle.val(column.title);

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

    const edit = new Edit();
    return edit;
  };
})( jQuery );