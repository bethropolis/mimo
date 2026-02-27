/**
 * Default workspace content for new users
 */

export const DEFAULT_FILE_CONTENTS = {
  'src/main.mimo': `import helpers from "../modules/helpers.mimo"
import array from "array"
import string from "string"

show "=== Mimo Playground Quick Tour ==="
show "Prefix math:"
show + 8 * 2 5

set products [
  { name: "Notebook", stock: 4, price: 12 },
  { name: "Marker", stock: 0, price: 3 },
  { name: "Desk Lamp", stock: 2, price: 28 }
]

show ""
show "In-stock report:"
set in_stock call array.filter(products, (fn p -> > p.stock 0))

for p in in_stock
  call helpers.line_for(p) -> line
  show line
end

show ""
call helpers.total_value(in_stock) -> total
show `Inventory value: $${total}`

call string.to_upper("edit src/main.mimo and run again!") -> tip
show tip`,
  'src/app.mimo': `import helpers from "../modules/helpers.mimo"

set sample { name: "Keyboard", stock: 6, price: 45 }
show call helpers.line_for(sample)`,
  'modules/helpers.mimo': `export function line_for(item)
  set status "Out of Stock"
  if > item.stock 0
    set status "In Stock"
  end
  return `${item.name} | $${item.price} | ${status}`
end

export function total_value(items)
  set totals call array.map(items, (fn p -> * p.stock p.price))
  return call array.reduce(totals, (fn acc n -> + acc n), 0)
end`
};

export const DEFAULT_TABS = [
  { id: 'src/main.mimo', name: 'main.mimo', content: DEFAULT_FILE_CONTENTS['src/main.mimo'] },
  { id: 'modules/helpers.mimo', name: 'helpers.mimo', content: DEFAULT_FILE_CONTENTS['modules/helpers.mimo'] }
];

export const DEFAULT_ACTIVE_TAB = 'src/main.mimo';
