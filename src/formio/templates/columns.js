import { applyPrefix } from '../utils';

// add a container for the columns styling with flexbox without affecting errors div etc.

const TEMPLATE = `
<div class="${applyPrefix('columns')}">
    {% ctx.component.columns.forEach(function(column, index) { %}
    <div class="
        col-{{column.size}}-{{column.width}}
        col-{{column.size}}-offset-{{column.offset}}
        col-{{column.size}}-push-{{column.push}}
        col-{{column.size}}-pull-{{column.pull}}
      " ref="{{ctx.columnKey}}">
      {{ctx.columnComponents[index]}}
    </div>
    {% }) %}
</div>
`;

export default TEMPLATE;