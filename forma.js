//forma.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('facturaForm');
    const loadingAnimation = document.getElementById('loadingAnimation');
    const successToast = document.getElementById('successToast');

    if (!form) {
        console.error('Formulario #facturaForm no encontrado en el DOM');
        return;
    }
    if (!loadingAnimation) {
        console.error('Elemento #loadingAnimation no encontrado en el DOM');
    }
    if (!successToast) {
        console.error('Elemento #successToast no encontrado en el DOM');
    }

    // Variable para rastrear si el formulario ha sido modificado
    let formIsDirty = false;

    // Detectar cambios en el formulario
    form.addEventListener('input', () => {
        formIsDirty = true;
    });

    // Detectar cambios en los archivos (inputs de tipo file)
    const fileInputs = form.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', () => {
            formIsDirty = true;
        });
    });

    // Evento beforeunload para mostrar advertencia nativa
    window.addEventListener('beforeunload', (e) => {
        if (formIsDirty) {
            const confirmationMessage = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.';
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    });

    // Función para validar campos obligatorios
    function validateRequiredFields() {
        const requiredFields = form.querySelectorAll('.required');
        let firstInvalidField = null;

        requiredFields.forEach(field => {
            let fieldId = field.id;
            let errorElement = null;
            let isValid = true;

            if (field.type === 'hidden') {
                const visibleField = form.querySelector(`input[name="${field.name.replace('_id', '_name')}"]`);
                if (visibleField) {
                    fieldId = visibleField.id;
                    errorElement = document.getElementById(`${fieldId}_error`);
                }
                isValid = !!field.value.trim();
            } else {
                errorElement = document.getElementById(`${fieldId}_error`);
                if (field.type === 'file') {
                    const previewImg = document.getElementById('voucherImagePreview');
                    isValid = (field.files && field.files.length > 0) || 
                              (previewImg && previewImg.tagName === 'IMG' && previewImg.src && !previewImg.src.includes('placeholder'));
                } else if (field.type === 'datetime-local') {
                    isValid = !!field.value;
                } else {
                    isValid = !!field.value.trim();
                }
            }

            field.classList.remove('invalid');
            if (errorElement) errorElement.style.display = 'none';

            if (!isValid) {
                field.classList.add('invalid');
                if (errorElement) {
                    errorElement.textContent = 'Este campo es obligatorio';
                    errorElement.style.display = 'block';
                }
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });

        if (firstInvalidField) {
            const tabContent = firstInvalidField.closest('.tab-content');
            if (tabContent) {
                const tabId = tabContent.id;
                const tabButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
                if (tabButton && !tabButton.classList.contains('active')) {
                    tabButton.click();
                }
            }
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
            return false;
        }
        return true;
    }

    // Función para limpiar el error y el resaltado cuando el usuario escribe o selecciona un valor
    function clearErrorOnInput(field) {
        let fieldId = field.id;
        let errorElement = null;
        let isValid = true;

        if (field.type === 'hidden') {
            const visibleField = form.querySelector(`input[name="${field.name.replace('_id', '_name')}"]`);
            if (visibleField) {
                fieldId = visibleField.id;
                errorElement = document.getElementById(`${fieldId}_error`);
            }
            isValid = !!field.value.trim();
        } else {
            errorElement = document.getElementById(`${fieldId}_error`);
            if (field.type === 'file') {
                const previewImg = document.getElementById('voucherImagePreview');
                isValid = (field.files && field.files.length > 0) || 
                          (previewImg && previewImg.tagName === 'IMG' && previewImg.src && !previewImg.src.includes('placeholder'));
            } else if (field.type === 'datetime-local') {
                isValid = !!field.value;
            } else {
                isValid = !!field.value.trim();
            }
        }

        if (isValid) {
            field.classList.remove('invalid');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }

    // Añadir eventos de input a todos los campos obligatorios para limpiar errores en tiempo real
    const requiredFields = form.querySelectorAll('.required');
    requiredFields.forEach(field => {
        if (field.type === 'file') {
            field.addEventListener('change', () => clearErrorOnInput(field));
        } else if (field.type === 'hidden') {
            const associatedInput = document.querySelector(`input[name="${field.name.replace('_id', '_name')}"]`);
            if (associatedInput) {
                associatedInput.addEventListener('input', () => clearErrorOnInput(field));
                associatedInput.addEventListener('change', () => clearErrorOnInput(field));
                const suggestionsDiv = document.getElementById(`${associatedInput.id}_suggestions`);
                if (suggestionsDiv) {
                    suggestionsDiv.addEventListener('click', () => setTimeout(() => clearErrorOnInput(field), 100));
                }
            }
        } else {
            field.addEventListener('input', () => clearErrorOnInput(field));
            field.addEventListener('change', () => clearErrorOnInput(field));
        }
    });

    // Manejar el botón "Ahora" para Fecha y Hora
    const setNowButton = document.getElementById('setNowButton');
    const fechaHoraInput = document.getElementById('fecha_hora');
    if (setNowButton && fechaHoraInput) {
        setNowButton.addEventListener('click', () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
            fechaHoraInput.value = formattedDate;
            console.log('Fecha y hora local seteadas:', formattedDate);
        });
    }

    // Manejar el envío del formulario
    // Manejar el envío del formulario
// Manejar el envío del formulario
form.addEventListener('submit', (e) => {
    const action = e.submitter?.getAttribute('value');
    console.log('Acción detectada al enviar el formulario:', action);

    // Validar campos obligatorios antes de cualquier acción
    if (!validateRequiredFields()) {
        e.preventDefault(); // Evitar el envío si la validación falla
        return;
    }

    // Ignorar la acción 'enviar', ya que será manejada por nueva_factura.js
    if (action === 'enviar') {
        console.log('Acción "enviar" será manejada por nueva_factura.js');
        formIsDirty = false; // Resetear al enviar con éxito
        return;
    }

    // Manejar la acción 'cargar'
    if (action === 'cargar') {
        e.preventDefault(); // Evitar la recarga de la página

        const fileCameraOcr = document.getElementById('fileCameraOcr');
        const fileGalleryOcr = document.getElementById('fileGalleryOcr');
        const hasFile = (fileCameraOcr && fileCameraOcr.files.length > 0) || 
                       (fileGalleryOcr && fileGalleryOcr.files.length > 0);

        if (!hasFile) {
            const previewImg = document.getElementById('ocrImagePreview');
            const hasPreview = previewImg && previewImg.tagName === 'IMG' && previewImg.src && !previewImg.src.includes('placeholder');
            if (!hasPreview) {
                alert('Por favor selecciona una imagen para realizar el OCR.');
                return;
            }
        }

        console.log('Iniciando envío del formulario con acción "cargar"');

        if (loadingAnimation) {
            loadingAnimation.style.display = 'block';
            console.log('Animación de carga mostrada');
        }

        const formData = new FormData(form);
        formData.append('action', 'cargar');
        console.log('Datos del formulario preparados:', Array.from(formData.entries()));

        fetch(form.getAttribute('action') || '/nueva_factura', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || `Error ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (loadingAnimation) {
                loadingAnimation.style.display = 'none';
                console.log('Animación de carga oculta');
            }

            if (data.success) {
                // Actualizar los campos del formulario con los datos del OCR
                const proveedorIdInput = document.getElementById('proveedor_id');
                const proveedorNameInput = document.getElementById('proveedor_name');
                const tarjetaIdInput = document.getElementById('tarjeta_id');
                const tarjetaNameInput = document.getElementById('tarjeta_name');
                const fechaHoraInput = document.getElementById('fecha_hora');
                const montoInput = document.getElementById('monto');
                const savedFileOcrInput = document.getElementById('saved_file_ocr');

                // Actualizar proveedor
                if (data.proveedor_id) {
                    proveedorIdInput.value = data.proveedor_id;
                    // Buscar el nombre del proveedor
                    fetch('/get_proveedores')
                        .then(res => res.json())
                        .then(proveedores => {
                            const proveedor = proveedores.find(p => p.id === parseInt(data.proveedor_id));
                            if (proveedor) {
                                proveedorNameInput.value = proveedor.nombre;
                            }
                        })
                        .catch(err => console.error('Error al cargar nombre del proveedor:', err));
                }

                // Actualizar tarjeta titular
                if (data.tarjeta_id) {
                    tarjetaIdInput.value = data.tarjeta_id;
                    // Buscar el nombre de la tarjeta
                    fetch('/get_tarjetas')
                        .then(res => res.json())
                        .then(tarjetas => {
                            const tarjeta = tarjetas.find(t => t.id === parseInt(data.tarjeta_id));
                            if (tarjeta) {
                                tarjetaNameInput.value = tarjeta.nombre;
                                // Disparar evento change para cargar tarjetas adicionales
                                tarjetaIdInput.dispatchEvent(new Event('change'));
                            }
                        })
                        .catch(err => console.error('Error al cargar nombre de la tarjeta:', err));
                }

                // Actualizar fecha y hora
                if (data.fecha_hora) {
                    fechaHoraInput.value = data.fecha_hora;
                }

                // Actualizar monto
                if (data.monto) {
                    montoInput.value = data.monto;
                    // Disparar evento input para actualizar los totales (si aplica)
                    montoInput.dispatchEvent(new Event('input'));
                }

                // Actualizar el campo oculto del archivo OCR
                if (data.saved_file_ocr) {
                    savedFileOcrInput.value = data.saved_file_ocr;
                }

                // Mostrar notificación de éxito
                showSuccessToast('Datos cargados exitosamente mediante OCR');
                formIsDirty = false; // Resetear al cargar con éxito
            } else {
                console.error('Error al cargar datos OCR:', data.message);
                showSuccessToast('Error al cargar datos: ' + (data.message || 'Sin mensaje'), true);
            }
        })
        .catch(error => {
            if (loadingAnimation) {
                loadingAnimation.style.display = 'none';
                console.log('Animación de carga oculta debido a un error');
            }
            console.error('Error al enviar el formulario:', error);
            showSuccessToast('Error al cargar los datos: ' + error.message, true);
        });
    }
});

// Función para mostrar el toast (agregada aquí porque no estaba definida en forma.js)
function showSuccessToast(message = 'Operación realizada con éxito', isError = false) {
    const toast = document.getElementById('successToast');
    if (!toast) {
        console.error('No se encontró #successToast en el DOM');
        return;
    }
    const textContainer = toast.querySelector('.text-container');
    if (!textContainer) {
        console.error('No se encontró .text-container en #successToast');
        return;
    }
    if (isError) {
        textContainer.innerHTML = `<p>Error</p><p>${message}</p>`;
        toast.style.backgroundColor = '#ff4444';
    } else {
        textContainer.innerHTML = `<p>Éxito</p><p>${message}</p>`;
        toast.style.backgroundColor = '#00C851';
    }
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.style.backgroundColor = '#00C851';
    }, 2000);
}

});