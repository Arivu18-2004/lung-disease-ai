/* ==========================================================================
   LungAI - Main JavaScript Variables & Interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Drag & Drop X-Ray Upload Logic ---
    const dropZone = document.getElementById('dropZone');
    const xrayInput = document.getElementById('xrayInput');
    const dropContent = document.getElementById('dropContent');
    const previewArea = document.getElementById('previewArea');
    const previewImg = document.getElementById('previewImg');
    const previewName = document.getElementById('previewName');

    if (dropZone && xrayInput) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', handleDrop, false);

        // Handle file browse using regular input change event
        xrayInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                handleFile(this.files[0]);
            }
        });
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            xrayInput.files = files; // Assign dropped file to the hidden input
            handleFile(files[0]);
        }
    }

    function handleFile(file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Invalid file format. Please upload an image file (PNG, JPG, BMP).');
            clearPreview();
            return;
        }

        // Display preview
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            previewName.textContent = file.name;
            dropContent.classList.add('d-none');
            previewArea.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    }

    // Exported function for the 'X' button
    window.clearPreview = function () {
        xrayInput.value = ''; // Clear file input
        previewImg.src = '';
        previewName.textContent = '';
        previewArea.classList.add('d-none');
        dropContent.classList.remove('d-none');
    };


    // --- 2. Form Submission Loader ---
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');

    if (uploadForm) {
        uploadForm.addEventListener('submit', function (e) {
            // Patient Validation Logic
            const existingPatient = document.getElementById('patientSelect').value;
            const newName = document.getElementById('patientName').value.trim();

            if (!existingPatient && !newName) {
                e.preventDefault();
                alert('Please select an existing patient or provide a new patient name.');
                return;
            }

            // Show loader animation on button
            submitBtn.disabled = true;
            btnText.classList.add('d-none');
            btnLoader.classList.remove('d-none');
        });
    }


    // --- 3. Patient Select Toggle Logic ---
    const patientSelect = document.getElementById('patientSelect');
    const newPatientFields = document.getElementById('newPatientFields');

    if (patientSelect && newPatientFields) {
        patientSelect.addEventListener('change', function () {
            if (this.value) {
                // If existing patient picked, dim/disable new patient fields
                newPatientFields.style.opacity = '0.4';
                newPatientFields.style.pointerEvents = 'none';
            } else {
                newPatientFields.style.opacity = '1';
                newPatientFields.style.pointerEvents = 'auto';
            }
        });
    }
});
