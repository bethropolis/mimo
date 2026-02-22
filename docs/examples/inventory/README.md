# Inventory Example

A product catalog system with dynamic pricing based on user type.

## Files

- `catalog.mimo` - Product data and search
- `pricing.mimo` - Discount calculation with pattern matching  
- `app.mimo` - Main application

## catalog.mimo

```mimo
export const PRODUCTS [
    { id: "P1", name: "Laptop", price: 1200, category: "electronics", stock: 10 },
    { id: "P2", name: "Mouse", price: 25, category: "electronics", stock: 50 },
    { id: "P3", name: "Shirt", price: 30, category: "clothing", stock: 100 },
    { id: "P4", name: "Keyboard", price: 75, category: "electronics", stock: 0 }
]

export function find_product(id)
    for p in PRODUCTS
        if = p.id id
            return p
        end
    end
    return null
end
```

## pricing.mimo

```mimo
import math from "math"

export function calculate_discount(product, user_type)
    match [product.category, user_type]
        case ["electronics", "VIP"]:
            return 0.20  // 20% off
        case ["electronics", "standard"]:
            return 0.05  // 5% off electronics for everyone
        case ["clothing", "VIP"]:
            return 0.15  // 15% off clothing for VIP
        default:
            return 0.0
    end
end

export function get_final_price(product, user_type)
    set discount call calculate_discount(product, user_type)
    set reduction * product.price discount
    return - product.price reduction
end
```

## app.mimo

```mimo
import catalog from "./catalog.mimo"
import pricing from "./pricing.mimo"

show "--- Mimo Inventory Report ---"

for p in catalog.PRODUCTS
    set status call if_else(> p.stock 0, "In Stock", "Out of Stock")
    show `Product: ${p.name} | Price: $${p.price} | ${status}`
    
    if > p.stock 0
        set vip_price call pricing.get_final_price(p, "VIP")
        show `  -> VIP Special Price: $${vip_price}`
    end
end

show "--- End of Report ---"
```

## Output

```
--- Mimo Inventory Report ---
Product: Laptop | Price: $1200 | In Stock
  -> VIP Special Price: $960
Product: Mouse | Price: $25 | In Stock
  -> VIP Special Price: $20
Product: Shirt | Price: $30 | In Stock
  -> VIP Special Price: $25.5
Product: Keyboard | Price: $75 | Out of Stock
--- End of Report ---
```
