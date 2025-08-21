export const ProductCard = (product) => {
    // Sanitize inputs to prevent XSS, although data is coming from trusted DB
    const escapeHTML = (str) => str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );

    const { id, title, subtitle, price_min, price_max, unit, image_url } = product;

    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden" data-product-id="${id}">
            <img src="${escapeHTML(image_url)}" alt="${escapeHTML(title)}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-bold">${escapeHTML(title)}</h3>
                <p class="text-gray-600 mb-2">${escapeHTML(subtitle)}</p>
                <div class="text-lg font-semibold text-green-600 mb-2">
                    ₦${Number(price_min).toLocaleString()} - ₦${Number(price_max).toLocaleString()}
                    <span class="text-sm text-gray-500">/ ${escapeHTML(unit)}</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <label for="qty-${id}" class="mr-2">Qty:</label>
                        <input type="number" id="qty-${id}" name="quantity" min="1" value="1" class="w-16 p-1 border rounded">
                    </div>
                    <button class="add-to-cart-btn bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        Add to Order
                    </button>
                </div>
            </div>
        </div>
    `;
};
