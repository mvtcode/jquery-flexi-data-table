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
      value: '&nbsp;&minus;&nbsp;',
    },
    {
      vfTitle: '|',
      vfCode: 'vertical',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'vertical',
      vfActualFieldTitle: 'Dấu dọc',
      value: '&nbsp;|&nbsp;',
    },
    {
      vfTitle: ',',
      vfCode: 'comma',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'comma',
      vfActualFieldTitle: 'Dấu phẩy',
      value: ',&nbsp;',
    },
    {
      vfTitle: '.',
      vfCode: 'dot',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'dot',
      vfActualFieldTitle: 'Dấu chấm',
      value: ',&nbsp;',
    },
    {
      vfTitle: ';',
      vfCode: 'semicolon',
      vfType: VfType.SYMBOL,
      vfAcutalField: 'semicolon',
      vfActualFieldTitle: 'Chấm phẩy',
      value: ';&nbsp;',
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

      this.drawVfFields();

      this.btnPlus.click(() => {
        this.addColumn();
      });
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

    Edit.prototype.addColumn = function () {
      //
    }

    Edit.prototype.onDragstart = function (e, field) {
      e.originalEvent.dataTransfer.setData("text", JSON.stringify(field));
    }

    const edit = new Edit();
    return edit;
  };
})( jQuery );