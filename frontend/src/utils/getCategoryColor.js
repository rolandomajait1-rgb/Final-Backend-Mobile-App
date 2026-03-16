const getCategoryColor = (categoryName) => {
    const colors = {
        'News': 'text-blue-700 bg-blue-100',
        'Literary': 'text-green-700 bg-green-100',
        'Sports': 'text-red-700 bg-red-100',
        'Opinion': 'text-gray-700 bg-gray-100',
        'Art': 'text-purple-700 bg-purple-100',
        'Features': 'text-yellow-700 bg-yellow-100',
        'Specials': 'text-indigo-700 bg-indigo-100'
    };
    return colors[categoryName] || 'text-gray-700 bg-gray-100';
};

export default getCategoryColor;