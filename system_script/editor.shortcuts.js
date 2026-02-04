document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        document.getElementById('saveFileBtn').click();
    }
});
