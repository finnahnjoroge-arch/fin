const fs = require('fs');

// Check checkout page
let c = fs.readFileSync('app/(storefront)/checkout/(main)/page.tsx', 'utf8');
const match = c.match(/PageSpinner text="([^"]+)"/);
console.log('Checkout page PageSpinner text:', JSON.stringify(match[1]));
console.log('Char codes:', [...match[1]].map(ch => ch.charCodeAt(0)));

// Check success page
let c2 = fs.readFileSync('app/(storefront)/checkout/success/page.tsx', 'utf8');
const matches = [...c2.matchAll(/PageSpinner text="([^"]+)"/g)];
for (const m of matches) {
    console.log('Success page PageSpinner text:', JSON.stringify(m[1]));
    console.log('Char codes:', [...m[1]].map(ch => ch.charCodeAt(0)));
}

// Check loading.tsx
let c3 = fs.readFileSync('app/(storefront)/checkout/(main)/loading.tsx', 'utf8');
const match3 = c3.match(/PageSpinner text="([^"]+)"/);
console.log('loading.tsx PageSpinner text:', JSON.stringify(match3[1]));
console.log('Char codes:', [...match3[1]].map(ch => ch.charCodeAt(0)));

// Check modal.tsx inline HTML
let c4 = fs.readFileSync('components/cart/modal.tsx', 'utf8');
const match4 = c4.match(/Loading checkout[^<]+/);
if (match4) {
    console.log('Modal inline text:', JSON.stringify(match4[0]));
}
