// nueva_factura.js
document.addEventListener('DOMContentLoaded', () => {
    /* ==================== 1. AJUSTE DE PADDING Y MANEJO DE PESTAÑAS ==================== */
    const tabBar = document.querySelector('.tab-buttons');
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabBar && tabContents.length > 0) {
        const tabBarHeight = tabBar.offsetHeight;
        tabContents.forEach(content => {
            content.style.paddingTop = `${tabBarHeight + 10}px`; // Margen extra
        });
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    function handleTabClick(e) {
        e.preventDefault();
        const button = this;
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        const targetContent = document.getElementById(button.dataset.tab);
        if (targetContent) {
            targetContent.classList.add('active');
            console.log('Contenido activado:', targetContent.id);
        } else {
            console.error('Contenido no encontrado para la pestaña:', button.dataset.tab);
        }
    }
    tabButtons.forEach(button => {
        button.addEventListener('click', handleTabClick);
        button.addEventListener('touchstart', handleTabClick);
    });
    console.log('Tab Buttons:', tabButtons);
    console.log('Tab Contents:', tabContents);

    /* ==================== 2. EVITAR INTERFERENCIAS TÁCTILES ==================== */
    document.addEventListener('touchmove', (e) => {
        const target = e.target;
        const isInsideSuggestions = target.closest('.autocomplete-suggestions');
        const tabBarLocal = document.querySelector('.tab-buttons');
        const isInsideTabBar = tabBarLocal && tabBarLocal.contains(target);

        if (isInsideSuggestions) {
            return; // Permitir desplazamiento dentro de sugerencias
        }
        if (!isInsideTabBar) {
            e.stopPropagation(); // Evitar propagación fuera de la barra de pestañas
        }
    }, { passive: false });

    /* ==================== 3. FUNCIÓN DE AUTOCOMPLETADO ==================== */
    function setupAutocomplete(input, hiddenID, container, dataList, displayKey, valueKey = 'id', hasOperable = false) {
        if (!input || !hiddenID || !container) {
            console.error('Faltan elementos para autocompletado:', { input, hiddenID, container });
            return;
        }

        document.body.appendChild(container); // Mover al body para posicionamiento absoluto

        const idGuardado = hiddenID.value;
        if (idGuardado && dataList.length > 0) {
            const encontrado = dataList.find(item => item[valueKey] === parseInt(idGuardado, 10));
            if (encontrado) input.value = encontrado[displayKey];
        }

        let repositionInterval = null;

        input.addEventListener('click', () => {
            mostrarSugerencias(dataList, container, hasOperable);
            repositionSuggestions(input, container);
            if (!repositionInterval) {
                repositionInterval = setInterval(() => {
                    if (container.style.display === 'block') {
                        repositionSuggestions(input, container);
                    } else {
                        clearInterval(repositionInterval);
                        repositionInterval = null;
                    }
                }, 100);
            }
        });

        input.addEventListener('input', () => {
            const texto = input.value.toLowerCase().trim();
            const resultados = texto ? dataList.filter(item => item[displayKey].toLowerCase().includes(texto)) : dataList;
            mostrarSugerencias(resultados, container, hasOperable);
            repositionSuggestions(input, container);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                container.style.display = 'none';
                input.classList.remove('suggestions-visible');
                if (repositionInterval) {
                    clearInterval(repositionInterval);
                    repositionInterval = null;
                }
            }, 200);
        });

        container.addEventListener('touchstart', (e) => e.stopPropagation());
        container.addEventListener('touchmove', (e) => e.stopPropagation());

        window.addEventListener('resize', () => {
            if (container.style.display === 'block') {
                repositionSuggestions(input, container);
            }
        });

        window.addEventListener('scroll', () => {
            if (container.style.display === 'block') {
                repositionSuggestions(input, container);
            }
        }, true);

        function mostrarSugerencias(lista, container, hasOperable) {
            container.innerHTML = '';
            lista.forEach(item => {
                const div = document.createElement('div');
                div.textContent = item[displayKey];
                div.classList.add('suggestion-item');
                const isOperable = !hasOperable || (hasOperable && item.operable);
                if (isOperable) {
                    div.addEventListener('click', () => {
                        input.value = item[displayKey];
                        hiddenID.value = item[valueKey];
                        container.innerHTML = '';
                        container.style.display = 'none';
                        input.classList.remove('suggestions-visible');
                        hiddenID.dispatchEvent(new Event('change')); // Disparar en el campo oculto
                        if (typeof checkForChanges === 'function') checkForChanges();
                    });
                } else {
                    div.style.color = '#ccc';
                    div.style.cursor = 'not-allowed';
                }
                container.appendChild(div);
            });
            container.style.display = 'block';
            input.classList.add('suggestions-visible');
        }
    }

    function repositionSuggestions(input, container) {
        const rect = input.getBoundingClientRect();
        container.style.position = 'absolute';
        container.style.width = `${input.offsetWidth}px`;
        container.style.left = `${rect.left + window.scrollX}px`;
        container.style.top = `${rect.bottom + window.scrollY}px`;
        const containerRect = container.getBoundingClientRect();
        if (containerRect.bottom > window.innerHeight) {
            container.style.top = `${rect.top + window.scrollY - containerRect.height}px`;
        }
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    /* ==================== 4. MANEJO DE IMÁGENES ==================== */
    const fileCameraOcr = document.getElementById('fileCameraOcr');
    const fileGalleryOcr = document.getElementById('fileGalleryOcr');

    if (fileCameraOcr) {
        fileCameraOcr.addEventListener('change', (e) => {
            fileGalleryOcr.value = ''; // Limpiar el otro input
            handleFileSelect(e, 'ocrPreviewContainer', 'ocrImagePreview', 'ocrLoadingSpinner');
        });
    } else {
        console.error('Elemento #fileCameraOcr no encontrado');
    }

    if (fileGalleryOcr) {
        fileGalleryOcr.addEventListener('change', (e) => {
            fileCameraOcr.value = ''; // Limpiar el otro input
            handleFileSelect(e, 'ocrPreviewContainer', 'ocrImagePreview', 'ocrLoadingSpinner');
        });
    } else {
        console.error('Elemento #fileGalleryOcr no encontrado');
    }

    let selectedInput = null;

    function selectCamera() {
        const fileCameraVoucher = document.getElementById('fileCameraVoucher');
        fileCameraVoucher.click();
        selectedInput = fileCameraVoucher;
    }

    function selectGallery() {
        const fileGalleryVoucher = document.getElementById('fileGalleryVoucher');
        fileGalleryVoucher.click();
        selectedInput = fileGalleryVoucher;
    }

    document.getElementById('fileCameraOcr').addEventListener('change', handleImagePreview);
    document.getElementById('fileGalleryOcr').addEventListener('change', handleImagePreview);

    function handleImagePreview(event) {
        const file = event.target.files[0];
        const ocrImagePreview = document.getElementById('ocrImagePreview');
        const ocrPlaceholder    = document.getElementById('ocrPlaceholder');
      
        if (file) {
          const reader = new FileReader();
          reader.onload = function(e) {
            ocrImagePreview.src = e.target.result;
            ocrImagePreview.style.display     = 'block';
            ocrPlaceholder.style.display      = 'none';
      
            // ← aquí: cuando ya tengas la miniatura, le pones el click
            ocrImagePreview.style.cursor = 'pointer';
            ocrImagePreview.addEventListener('click', () => {
              openImagePreviewModal(ocrImagePreview.src);
            });
          };
          reader.readAsDataURL(file);
        } else {
          ocrImagePreview.style.display = 'none';
          ocrPlaceholder.style.display  = 'block';
        }
      }
      

    const btnCameraVoucher = document.getElementById('btnCameraVoucher');
    const btnGalleryVoucher = document.getElementById('btnGalleryVoucher');
    if (btnCameraVoucher) btnCameraVoucher.addEventListener('click', selectCamera);
    else console.error('Botón btnCameraVoucher no encontrado');
    if (btnGalleryVoucher) btnGalleryVoucher.addEventListener('click', selectGallery);
    else console.error('Botón btnGalleryVoucher no encontrado');

    const fileCameraVoucher = document.getElementById('fileCameraVoucher');
    const fileGalleryVoucher = document.getElementById('fileGalleryVoucher');
    if (fileCameraVoucher) {
        fileCameraVoucher.addEventListener('change', (e) => {
            fileGalleryVoucher.value = '';
            selectedInput = fileCameraVoucher;
            handleFileSelect(e, 'voucherPreviewContainer', 'voucherImagePreview', 'voucherLoadingSpinner');
        });
    }
    if (fileGalleryVoucher) {
        fileGalleryVoucher.addEventListener('change', (e) => {
            fileCameraVoucher.value = '';
            selectedInput = fileGalleryVoucher;
            handleFileSelect(e, 'voucherPreviewContainer', 'voucherImagePreview', 'voucherLoadingSpinner');
        });
    }

    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            if (selectedInput) {
                if (selectedInput === fileCameraVoucher) fileGalleryVoucher.disabled = true;
                else fileCameraVoucher.disabled = true;
            }
        });
    }

    // Elementos del modal
    const imagePreviewModal = document.getElementById('imagePreviewModal');
    const fullImagePreview = document.getElementById('fullImagePreview');
    const closeImagePreview = document.getElementById('closeImagePreview');

    // Verificar que los elementos del modal existan
    if (!imagePreviewModal || !fullImagePreview || !closeImagePreview) {
        console.error('Elementos del modal de vista previa no encontrados:', {
            imagePreviewModal,
            fullImagePreview,
            closeImagePreview
        });
    }

    // Función para abrir el modal
    function openImagePreviewModal(imageSrc) {
        console.log('Intentando abrir modal con imageSrc:', imageSrc);
        if (!imageSrc || typeof imageSrc !== 'string' || imageSrc.trim() === '') {
            console.error('imageSrc está vacío o no es válido:', imageSrc);
            showSuccessToast('Error: No se pudo cargar la imagen para la vista previa.', true);
            return;
        }
        // Limpia el src anterior para forzar una recarga
        fullImagePreview.src = '';
        fullImagePreview.src = imageSrc;
        imagePreviewModal.classList.add('open');
        const modalContent = imagePreviewModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('show');
        } else {
            console.error('Contenido del modal de vista previa no encontrado');
        }
        document.body.classList.add('modal-open');
        imagePreviewModal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    
    function closeImagePreviewModal() {
        const modalContent = imagePreviewModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('show'); // Remueve la clase .show
        }
        imagePreviewModal.classList.remove('open');
        fullImagePreview.src = '';
        document.body.classList.remove('modal-open');
    }

    // Añadir eventos al modal (cerrar)
    if (imagePreviewModal && closeImagePreview) {
        closeImagePreview.addEventListener('click', closeImagePreviewModal);

        // Cerrar el modal al tocar fuera de la imagen
        imagePreviewModal.addEventListener('click', (e) => {
            if (e.target === imagePreviewModal) {
                closeImagePreviewModal();
            }
        });
    }

    function handleFileSelect(event, previewContainerId, imagePreviewId, loadingSpinnerId) {
        const file = event.target.files[0];
        const previewContainer = document.getElementById(previewContainerId);
        const spinner = document.getElementById(loadingSpinnerId);

        if (!previewContainer || !spinner) {
            console.error('Contenedor de vista previa o spinner no encontrado:', { previewContainerId, loadingSpinnerId });
            return;
        }

        if (!file) {
            alert('No se seleccionó ninguna imagen.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.).');
            event.target.value = '';
            return;
        }

        const maxSizeBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSizeBytes) {
            alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
            event.target.value = '';
            return;
        }

        if (file.size === 0) {
            alert('El archivo está vacío.');
            event.target.value = '';
            return;
        }

        spinner.style.display = 'block';
        const existingPreview = document.getElementById(imagePreviewId);
        if (existingPreview) previewContainer.removeChild(existingPreview);

        const preview = document.createElement('img');
        preview.id = imagePreviewId;
        preview.className = 'image-preview';
        previewContainer.insertBefore(preview, spinner);

        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.onerror = () => {
            alert('Error al leer el archivo. Por favor, intenta de nuevo.');
            spinner.style.display = 'none';
            event.target.value = '';
        };
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Definir dimensiones objetivo (máximo 1200x1600 como en computadora)
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1600;
            let width = img.width;
            let height = img.height;

            // Calcular nuevas dimensiones manteniendo la proporción
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }
            }

            // Asegurar que las dimensiones sean razonables
            if (width < 300 || height < 300) {
                alert('La imagen es demasiado pequeña. Por favor, selecciona una imagen de mayor resolución.');
                spinner.style.display = 'none';
                event.target.value = '';
                return;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a JPEG con calidad optimizada
            canvas.toBlob((blob) => {
                if (!blob) {
                    alert('Error al convertir la imagen. Por favor, intenta de nuevo.');
                    spinner.style.display = 'none';
                    event.target.value = '';
                    return;
                }
                const convertedFile = new File([blob], 'voucher.jpg', { type: 'image/jpeg' });
                const previewReader = new FileReader();
                previewReader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                    spinner.style.display = 'none';

                    // Añadir evento de clic al nuevo elemento img
                    preview.addEventListener('click', () => {
                        console.log('Clic en la vista previa, src:', preview.src);
                        openImagePreviewModal(preview.src);
                    });

                    // Actualizar el input con el archivo redimensionado
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(convertedFile);
                    event.target.files = dataTransfer.files;

                    console.log('Imagen redimensionada:', {
                        width: width,
                        height: height,
                        size: convertedFile.size,
                        type: convertedFile.type
                    });
                };
                previewReader.onerror = () => {
                    alert('Error al mostrar la vista previa. Por favor, intenta de nuevo.');
                    spinner.style.display = 'none';
                };
                previewReader.readAsDataURL(convertedFile);
            }, 'image/jpeg', 0.8); // Calidad 80% para aproximar ~128KB
        };
        img.onerror = () => {
            alert('Error al procesar la imagen. Es posible que el archivo esté corrupto.');
            spinner.style.display = 'none';
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    }

    /* ==================== 4.1. MANEJO DE IMAGEN CARGADA DESDE EL SERVIDOR ==================== */
    const voucherImagePreview = document.getElementById('voucherImagePreview');
    if (voucherImagePreview && voucherImagePreview.tagName === 'IMG') {
        voucherImagePreview.addEventListener('click', () => {
            openImagePreviewModal(voucherImagePreview.src);
        });
    }

    /* ==================== 5. VARIABLES Y UNIQUE KEY ==================== */
    let uniqueKey = null;
    const uniqueKeyElement = document.getElementById('unique_key');
    if (uniqueKeyElement && uniqueKeyElement.value) {
        uniqueKey = uniqueKeyElement.value;
        console.log('Unique Key cargado desde HTML:', uniqueKey);
    } else {
        fetch('/get_unique_key')
            .then(response => {
                if (!response.ok) throw new Error('Error al obtener Unique Key');
                return response.json();
            })
            .then(data => {
                uniqueKey = data.unique_key;
                if (uniqueKeyElement) uniqueKeyElement.value = uniqueKey;
                console.log('Unique Key cargado desde servidor:', uniqueKey);
            })
            .catch(error => console.error('Error al cargar Unique Key:', error));
    }

/* ==================== 6. CARGA DE CATÁLOGOS Y AUTOCOMPLETADOS ==================== */
let clientes = [], tarjetas = [], tarjetasAdicionales = [], mediosCompra = [];
let paises = [], allCiudades = [], monedas = [], proveedores = [], cuentas = [], centrosCosto = [];

fetch('/get_centros_costo')
    .then(response => {
        if (!response.ok) throw new Error('Error en /get_centros_costo: ' + response.status);
        return response.json();
    })
    .then(data => {
        centrosCosto = data;
        setupInitialAutocomplete('centro_costo', 'centro_costo_id', 'centro_costo_suggestions', centrosCosto, 'nombre');
    })
    .catch(error => console.error('Error al cargar centros de costo:', error));

fetch('/get_cuentas')
    .then(response => {
        if (!response.ok) throw new Error('Error en /get_cuentas: ' + response.status);
        return response.json();
    })
    .then(data => {
        cuentas = data;
        setupInitialAutocomplete('cuenta', 'cuenta_id', 'cuenta_suggestions', cuentas, 'nombre', 'id', true);
    })
    .catch(error => console.error('Error al cargar cuentas:', error));

const autocompleteElements = {
    cliente: { input: document.getElementById('cliente_name'), hiddenID: document.getElementById('cliente_id'), container: document.getElementById('cliente_suggestions'), error: document.getElementById('cliente_error'), endpoint: '/get_clientes', key: 'nombre', list: clientes },
    tarjeta: { input: document.getElementById('tarjeta_name'), hiddenID: document.getElementById('tarjeta_id'), container: document.getElementById('tarjeta_suggestions'), error: document.getElementById('tarjeta_error'), endpoint: '/get_tarjetas', key: 'nombre', list: tarjetas },
    tarjetaAdicional: { input: document.getElementById('tarjeta_adicional_name'), hiddenID: document.getElementById('tarjeta_adicional'), container: document.getElementById('tarjeta_adicional_suggestions'), error: document.getElementById('tarjeta_adicional_error'), endpoint: null, key: 'nombre', list: tarjetasAdicionales },
    medioCompra: { input: document.getElementById('medio_compra_name'), hiddenID: document.getElementById('medio_compra'), container: document.getElementById('medio_compra_suggestions'), error: document.getElementById('medio_compra_error'), endpoint: '/get_medios_compra', key: 'nombre', list: mediosCompra },
    pais: { input: document.getElementById('pais_name'), hiddenID: document.getElementById('pais'), container: document.getElementById('pais_suggestions'), error: document.getElementById('pais_error'), endpoint: '/get_paises', key: 'nombre', list: paises },
    ciudad: { 
        input: document.getElementById('ciudad_name'), 
        hiddenID: document.getElementById('ciudad'), 
        container: document.getElementById('ciudad_suggestions'), 
        error: document.getElementById('ciudad_error'), 
        endpoint: '/get_ciudades', // Endpoint sin pais_id
        key: 'nombre', 
        list: allCiudades 
    },   
    moneda: { 
        input: document.getElementById('moneda_name'), 
        hiddenID: document.getElementById('moneda'), 
        container: document.getElementById('moneda_suggestions'), 
        error: document.getElementById('moneda_error'), 
        endpoint: '/get_monedas', // Endpoint sin pais_id
        key: 'nombre', 
        list: monedas 
    },
    proveedor: { input: document.getElementById('proveedor_name'), hiddenID: document.getElementById('proveedor_id'), container: document.getElementById('proveedor_suggestions'), error: document.getElementById('proveedor_error'), endpoint: '/get_proveedores', key: 'nombre', list: proveedores }
};

function showError(errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    }
}

function setupInitialAutocomplete(inputId, hiddenId, containerId, dataList, key, valueKey = 'id', hasOperable = false) {
    const input = document.getElementById(inputId);
    const hiddenID = document.getElementById(hiddenId);
    const container = document.getElementById(containerId);
    setupAutocomplete(input, hiddenID, container, dataList, key, valueKey, hasOperable);
}

Object.values(autocompleteElements).forEach(elem => {
    if (elem.endpoint && elem.key !== 'ciudad' && elem.key !== 'moneda' && elem.key !== 'pais') {
        fetch(elem.endpoint)
            .then(response => response.json())
            .then(data => {
                elem.list = data;
                setupAutocomplete(elem.input, elem.hiddenID, elem.container, elem.list, elem.key);
            })
            .catch(error => {
                console.error(`Error al cargar ${elem.endpoint}:`, error);
                showError(elem.error, `Error al cargar ${elem.endpoint}`);
            });
    }
});

const tarjetaHidden = document.getElementById('tarjeta_id');
const tarjetaAdicionalInput = document.getElementById('tarjeta_adicional_name');
const tarjetaAdicionalHidden = document.getElementById('tarjeta_adicional');
const tarjetaAdicionalContainer = document.getElementById('tarjeta_adicional_suggestions');

// Verificar que los elementos existen
if (!tarjetaHidden) {
    console.error('Elemento #tarjeta_id no encontrado en el DOM');
} else if (!tarjetaAdicionalInput) {
    console.error('Elemento #tarjeta_adicional_name no encontrado en el DOM');
} else if (!tarjetaAdicionalHidden) {
    console.error('Elemento #tarjeta_adicional no encontrado en el DOM');
} else if (!tarjetaAdicionalContainer) {
    console.error('Elemento #tarjeta_adicional_suggestions no encontrado en el DOM');
} else {
    // Cargar tarjetas titulares al iniciar
    console.log('Iniciando solicitud a /get_tarjetas');
    fetch('/get_tarjetas')
        .then(response => {
            console.log('Respuesta de /get_tarjetas recibida:', response);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos de tarjetas titulares:', data);
            if (!Array.isArray(data)) {
                throw new Error('Los datos de /get_tarjetas no son un array');
            }
            autocompleteElements.tarjeta.list = data;
            setupAutocomplete(
                document.getElementById('tarjeta_name'),
                tarjetaHidden,
                document.getElementById('tarjeta_suggestions'),
                data,
                'nombre',
                'id'
            );
            // Forzar evento change si hay un valor inicial
            if (tarjetaHidden.value) {
                console.log('Valor inicial en tarjetaHidden:', tarjetaHidden.value);
                tarjetaHidden.dispatchEvent(new Event('change'));
            }
        })
        .catch(error => {
            console.error('Error al cargar tarjetas titulares:', error.message);
            showError(autocompleteElements.tarjeta.error, `Error al cargar tarjetas: ${error.message}`);
        });

    // Listener para cambio en tarjeta titular
    tarjetaHidden.addEventListener('change', (e) => {
        const titularId = e.target.value;
        console.log('Evento change disparado - Tarjeta titular seleccionada, ID:', titularId);
        if (titularId) {
            console.log('Haciendo solicitud a /get_tarjetas_adicionales/' + titularId);
            fetch(`/get_tarjetas_adicionales/${titularId}`)
                .then(response => {
                    console.log('Respuesta de /get_tarjetas_adicionales:', response);
                    if (!response.ok) {
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Datos de tarjetas adicionales:', data);
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    autocompleteElements.tarjetaAdicional.list = data;
                    tarjetaAdicionalInput.value = '';
                    tarjetaAdicionalHidden.value = '';
                    tarjetaAdicionalContainer.innerHTML = '';
                    setupAutocomplete(
                        tarjetaAdicionalInput,
                        tarjetaAdicionalHidden,
                        tarjetaAdicionalContainer,
                        data,
                        'nombre',
                        'id'
                    );
                    if (data.length === 0) {
                        tarjetaAdicionalInput.placeholder = 'No hay tarjetas adicionales';
                        tarjetaAdicionalInput.disabled = true;
                        console.log('No se encontraron tarjetas adicionales');
                    } else {
                        tarjetaAdicionalInput.placeholder = 'Selecciona una tarjeta adicional';
                        tarjetaAdicionalInput.disabled = false;
                        console.log('Tarjetas adicionales cargadas:', data);
                    }
                })
                .catch(error => {
                    console.error('Error al cargar tarjetas adicionales:', error.message);
                    tarjetaAdicionalInput.value = '';
                    tarjetaAdicionalHidden.value = '';
                    tarjetaAdicionalInput.disabled = true;
                    tarjetaAdicionalInput.placeholder = 'Error al cargar tarjetas adicionales';
                    tarjetaAdicionalContainer.innerHTML = '';
                    showError(autocompleteElements.tarjetaAdicional.error, `Error al cargar tarjetas adicionales: ${error.message}`);
                });
        } else {
            tarjetaAdicionalInput.value = '';
            tarjetaAdicionalHidden.value = '';
            tarjetaAdicionalInput.disabled = true;
            tarjetaAdicionalInput.placeholder = 'Selecciona una tarjeta titular primero';
            autocompleteElements.tarjetaAdicional.list = [];
            tarjetaAdicionalContainer.innerHTML = '';
            console.log('No se seleccionó tarjeta titular');
        }
    });
}

// En el bloque donde se define el evento change para paisHidden
const paisHidden = document.getElementById('pais');
if (paisHidden) {
    paisHidden.addEventListener('change', (e) => {
        const paisId = e.target.value;
        console.log('País seleccionado, ID:', paisId);
    
        // Guardar el valor actual de la ciudad antes de limpiar
        const currentCiudadId = autocompleteElements.ciudad.hiddenID.value;
        const currentCiudadNombre = autocompleteElements.ciudad.input.value;
    
        // Limpiar los campos de moneda y ciudad (si es necesario)
        autocompleteElements.moneda.input.value = '';
        autocompleteElements.moneda.hiddenID.value = '';
    
        if (paisId) {
            const filteredCiudades = allCiudades.filter(c => c.id_pais === parseInt(paisId, 10));
            const filteredMonedas = monedas.filter(m => m.id_pais === parseInt(paisId, 10));
    
            // Verificar si la ciudad actual sigue siendo válida para el país seleccionado
            let ciudadValida = false;
            if (currentCiudadId) {
                ciudadValida = filteredCiudades.some(c => c.id === parseInt(currentCiudadId, 10));
            }
    
            // Si la ciudad actual no es válida, limpiarla
            if (!ciudadValida) {
                autocompleteElements.ciudad.input.value = '';
                autocompleteElements.ciudad.hiddenID.value = '';
                autocompleteElements.ciudad.input.placeholder = 'Selecciona una ciudad';
            }
    
            // Configurar el autocompletado con las ciudades filtradas
            setupAutocomplete(
                autocompleteElements.ciudad.input,
                autocompleteElements.ciudad.hiddenID,
                autocompleteElements.ciudad.container,
                filteredCiudades,
                'nombre'
            );
    
            // Configurar el autocompletado para las monedas
            setupAutocomplete(
                autocompleteElements.moneda.input,
                autocompleteElements.moneda.hiddenID,
                autocompleteElements.moneda.container,
                filteredMonedas,
                'nombre'
            );
    
            // Manejar casos de error o ausencia de datos
            if (filteredCiudades.length === 0) {
                showError(autocompleteElements.ciudad.error, 'No hay ciudades disponibles para este país');
                autocompleteElements.ciudad.input.disabled = true;
                autocompleteElements.ciudad.input.placeholder = 'No hay ciudades disponibles';
            } else {
                console.log('Ciudades cargadas:', filteredCiudades);
                // Si la ciudad es válida, restaurarla
                if (ciudadValida) {
                    autocompleteElements.ciudad.input.value = currentCiudadNombre;
                    autocompleteElements.ciudad.hiddenID.value = currentCiudadId;
                }
            }
    
            if (filteredMonedas.length === 0) {
                showError(autocompleteElements.moneda.error, 'No hay monedas disponibles para este país');
                autocompleteElements.moneda.input.disabled = true;
                autocompleteElements.moneda.input.placeholder = 'No hay monedas disponibles';
            } else {
                const predeterminada = filteredMonedas.find(m => m.predeterminada);
                if (predeterminada) {
                    autocompleteElements.moneda.input.value = predeterminada.nombre;
                    autocompleteElements.moneda.hiddenID.value = predeterminada.id;
                    console.log('Moneda predeterminada seleccionada:', predeterminada.nombre);
                }
            }
        }
    });
    }
    // Modificar la función sincronizarCamposIniciales
function sincronizarCamposIniciales() {
    const paisHidden = document.getElementById('pais');
    const ciudadHidden = document.getElementById('ciudad');
    const monedaHidden = document.getElementById('moneda');
    const paisNameInput = document.getElementById('pais_name');
    const ciudadNameInput = document.getElementById('ciudad_name');
    const monedaNameInput = document.getElementById('moneda_name');

    if (paisHidden.value && autocompleteElements.pais.list.length > 0) {
        const paisId = parseInt(paisHidden.value, 10);
        const pais = autocompleteElements.pais.list.find(p => p.id === paisId);
        if (pais) {
            paisNameInput.value = pais.nombre;
            console.log('País inicial establecido:', pais.nombre);

            // Filtrar ciudades para el país predeterminado
            const filteredCiudades = allCiudades.filter(c => c.id_pais === paisId);
            if (filteredCiudades.length > 0) {
                // Intentar seleccionar la ciudad predeterminada (ID_CIUDAD desde configuración)
                const defaultCiudadId = parseInt(ciudadHidden.value, 10);
                const defaultCiudad = filteredCiudades.find(c => c.id === defaultCiudadId);
                if (defaultCiudad) {
                    ciudadNameInput.value = defaultCiudad.nombre;
                    ciudadHidden.value = defaultCiudad.id;
                    console.log('Ciudad predeterminada establecida:', defaultCiudad.nombre);
                } else {
                    console.warn('Ciudad predeterminada no encontrada para el país:', paisId);
                    ciudadNameInput.value = '';
                    ciudadHidden.value = '';
                    ciudadNameInput.placeholder = 'Selecciona una ciudad';
                }

                // Configurar autocompletado con las ciudades filtradas
                setupAutocomplete(
                    autocompleteElements.ciudad.input,
                    autocompleteElements.ciudad.hiddenID,
                    autocompleteElements.ciudad.container,
                    filteredCiudades,
                    'nombre'
                );
            } else {
                console.warn('No hay ciudades disponibles para el país predeterminado:', paisId);
                ciudadNameInput.value = '';
                ciudadHidden.value = '';
                ciudadNameInput.placeholder = 'No hay ciudades disponibles';
                showError(autocompleteElements.ciudad.error, 'No hay ciudades disponibles para este país');
            }

            // Filtrar monedas para el país predeterminado (lógica existente)
            const filteredMonedas = monedas.filter(m => m.id_pais === paisId);
            if (filteredMonedas.length > 0) {
                const predeterminada = filteredMonedas.find(m => m.predeterminada);
                if (predeterminada) {
                    monedaNameInput.value = predeterminada.nombre;
                    monedaHidden.value = predeterminada.id;
                    console.log('Moneda predeterminada seleccionada:', predeterminada.nombre);
                } else {
                    console.log('No se encontró moneda predeterminada, seleccionando la primera disponible');
                    const primeraMoneda = filteredMonedas[0];
                    monedaNameInput.value = primeraMoneda.nombre;
                    monedaHidden.value = primeraMoneda.id;
                }

                // Configurar autocompletado con las monedas filtradas
                setupAutocomplete(
                    autocompleteElements.moneda.input,
                    autocompleteElements.moneda.hiddenID,
                    autocompleteElements.moneda.container,
                    filteredMonedas,
                    'nombre'
                );
            } else {
                console.warn('No hay monedas disponibles para el país predeterminado:', paisId);
                monedaNameInput.value = '';
                monedaHidden.value = '';
                monedaNameInput.placeholder = 'No hay monedas disponibles';
                showError(autocompleteElements.moneda.error, 'No hay monedas disponibles para este país');
            }
        } else {
            console.error('País inicial no encontrado en la lista:', paisId);
            showError(autocompleteElements.pais.error, 'País inicial no válido');
            ciudadNameInput.value = '';
            ciudadHidden.value = '';
            monedaNameInput.value = '';
            monedaHidden.value = '';
        }
    } else {
        console.log('No hay país inicial o la lista de países no está cargada');
        ciudadNameInput.placeholder = 'Selecciona un país primero';
        monedaNameInput.placeholder = 'Selecciona un país primero';
    }
}

// Cargar países, ciudades y monedas en paralelo, y luego sincronizar
Promise.all([
    fetch('/get_paises')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar países');
            return response.json();
        })
        .then(data => {
            autocompleteElements.pais.list = data;
            setupAutocomplete(
                autocompleteElements.pais.input,
                autocompleteElements.pais.hiddenID,
                autocompleteElements.pais.container,
                data,
                'nombre'
            );
        })
        .catch(error => {
            console.error('Error al cargar países:', error);
            showError(autocompleteElements.pais.error, 'Error al cargar países');
            throw error; // Propagar el error para que Promise.all lo capture
        }),

    fetch('/get_ciudades')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar ciudades');
            return response.json();
        })
        .then(data => {
            allCiudades = data;
            autocompleteElements.ciudad.list = data;
            setupAutocomplete(
                autocompleteElements.ciudad.input,
                autocompleteElements.ciudad.hiddenID,
                autocompleteElements.ciudad.container,
                data,
                'nombre'
            );
        })
        .catch(error => {
            console.error('Error al cargar ciudades:', error);
            showError(autocompleteElements.ciudad.error, 'Error al cargar ciudades');
            throw error; // Propagar el error para que Promise.all lo capture
        }),

    fetch('/get_monedas')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar monedas');
            return response.json();
        })
        .then(data => {
            monedas = data;
            autocompleteElements.moneda.list = data;
            setupAutocomplete(
                autocompleteElements.moneda.input,
                autocompleteElements.moneda.hiddenID,
                autocompleteElements.moneda.container,
                data,
                'nombre'
            );
        })
        .catch(error => {
            console.error('Error al cargar monedas:', error);
            showError(autocompleteElements.moneda.error, 'Error al cargar monedas');
            throw error; // Propagar el error para que Promise.all lo capture
        })
])
.then(() => {
    // Una vez que todas las solicitudes se completen, sincronizar los campos iniciales
    sincronizarCamposIniciales();
    const paisHidden = document.getElementById('pais');
    if (paisHidden.value) {
        console.log('Disparando evento change inicial para pais_id:', paisHidden.value);
        paisHidden.dispatchEvent(new Event('change'));
    }
})
.catch(error => {
    console.error('Error al cargar datos iniciales:', error);
    // Limpiar campos dependientes en caso de error
    autocompleteElements.ciudad.input.value = '';
    autocompleteElements.ciudad.hiddenID.value = '';
    autocompleteElements.moneda.input.value = '';
    autocompleteElements.moneda.hiddenID.value = '';
});

    /* ==================== 7. FUNCIONALIDAD PARA DETALLE CUENTAS ==================== */
    let editingIndex = null;
    let originalData = null;
    let accounts = []; // Variable global para almacenar las cuentas
    let formSubmitted = false; // Bandera para controlar el envío del formulario

    const btnAgregarCuenta = document.getElementById('btnAgregarCuenta');
    const btnDiscard = document.getElementById('btnDiscard');
    const btnConfirmEdit = document.getElementById('btnConfirmEdit');
    const actionButtons = document.getElementById('actionButtons');
    const editButtons = document.getElementById('editButtons');
    const inputs = ['cuenta', 'cuenta_id', 'centro_costo', 'centro_costo_id', 'total', 'comentarios_cuenta'];
    const cuentaInput = document.getElementById('cuenta');
    const cuentaIdInput = document.getElementById('cuenta_id');
    const centroCostoInput = document.getElementById('centro_costo');
    const centroCostoIdInput = document.getElementById('centro_costo_id');
    const totalInput = document.getElementById('total');
    const comentariosInput = document.getElementById('comentarios_cuenta');
    const cuentasTable = document.getElementById('cuentasTable');
    const totalDistribucionInput = document.getElementById('total_distribucion_cuentas');
    const faltaPorDistribuirInput = document.getElementById('falta_por_distribuir');
    const deleteModal = document.getElementById('deleteModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    const loadingAnimation = document.getElementById('loadingAnimation');
    const successToast = document.getElementById('successToast');
    const montoInput = document.getElementById('monto');

    // Agregar eventos a montoInput
    if (montoInput) {
        montoInput.addEventListener('input', updateTotals);
        montoInput.addEventListener('change', updateTotals);
    }

    if (!loadingAnimation) {
        console.error('Elemento #loadingAnimation no encontrado en el DOM');
    }
    if (!successToast) {
        console.error('Elemento #successToast no encontrado en el DOM');
    }

    function clearForm() {
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
        btnAgregarCuenta.disabled = true;
        editingIndex = null;
        originalData = null;
        actionButtons.style.display = 'block';
        editButtons.style.display = 'none';
    }

    function validateFields() {
        const cuentaId = cuentaIdInput.value;
        const centroCostoId = centroCostoIdInput.value;
        const total = parseFloat(totalInput.value);
        return cuentaId && centroCostoId && !isNaN(total) && total > 0;
    }

    function checkForChanges() {
        if (editingIndex === null) {
            btnAgregarCuenta.disabled = !validateFields();
            return;
        }
        const currentData = {
            cuenta_id: cuentaIdInput.value,
            centro_costo_id: centroCostoIdInput.value,
            total: totalInput.value,
            comentarios: comentariosInput.value
        };
        const hasChanges = Object.keys(currentData).some(key => currentData[key] !== originalData[key]);
        btnConfirmEdit.disabled = !hasChanges || !validateFields();
    }

    async function fetchAccounts() {
        if (!uniqueKey) {
            throw new Error('Unique Key no está definido. Asegúrate de que se haya cargado correctamente.');
        }
        const formData = new FormData();
        formData.append('unique_key', uniqueKey);
        console.log('Enviando solicitud a /check_temp_accounts con unique_key:', uniqueKey);
        const response = await fetch('/check_temp_accounts', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log('Respuesta de /check_temp_accounts:', data);
        if (data.success) {
            return data.accounts;
        } else {
            throw new Error(data.message || 'Error al obtener cuentas');
        }
    }

    async function updateTable() {
        try {
            accounts = await fetchAccounts(); // Actualiza la variable global
            console.log('Cuentas obtenidas en updateTable:', accounts);
            const tbody = cuentasTable.querySelector('tbody');
            tbody.innerHTML = '';
            accounts.forEach((account, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account.id_compra_cuenta}</td>
                    <td>${account.cuenta_nombre}</td>
                    <td>${account.centro_costo_nombre}</td>
                    <td>${parseFloat(account.monto).toFixed(2)}</td>
                    <td>${account.comentarios || ''}</td>
                    <td><div class="action-buttons"><button type="button" class="btn-modify" data-index="${index}" data-id-compra-cuenta="${account.id_compra_cuenta}">Modificar</button><button type="button" class="btn-delete" data-index="${index}" data-id-compra-cuenta="${account.id_compra_cuenta}">Eliminar</button></div></td>
                `;
                tbody.appendChild(row);
            });
            cuentasTable.style.display = accounts.length > 0 ? 'table' : 'none';
            await updateTotals(); // Llama a updateTotals después de actualizar la tabla

            const suggestionsContainers = document.querySelectorAll('.autocomplete-suggestions');
            suggestionsContainers.forEach(container => {
                if (container.style.display === 'block') {
                    const input = container.previousElementSibling.previousElementSibling;
                    if (input && input.tagName === 'INPUT') repositionSuggestions(input, container);
                }
            });
        } catch (error) {
            console.error('Error al actualizar tabla:', error);
            showSuccessToast('Error: ' + error.message, true);
        }
    }

    async function updateTotals() {
        try {
            accounts = await fetchAccounts(); // Obtiene las cuentas actualizadas del servidor
            console.log('Cuentas obtenidas en updateTotals:', accounts);
            const totalDistribucion = accounts.reduce((sum, acc) => sum + parseFloat(acc.monto), 0);
            const montoTotal = montoInput ? (parseFloat(montoInput.value) || 0) : 0;
            let totalProvisional = totalDistribucion;
            if (accounts.length === 0) {
                const totalInputValue = parseFloat(totalInput.value) || 0;
                totalProvisional += totalInputValue;
            }
            totalDistribucionInput.value = totalProvisional.toFixed(2);
            faltaPorDistribuirInput.value = (montoTotal - totalProvisional).toFixed(2);
        } catch (error) {
            console.error('Error al actualizar totales:', error);
            totalDistribucionInput.value = '0.00';
            faltaPorDistribuirInput.value = (parseFloat(montoInput.value) || 0).toFixed(2);
        }
    }

    if (btnAgregarCuenta) {
        btnAgregarCuenta.addEventListener('click', async () => {
            const formData = new FormData();
            formData.append('unique_key', uniqueKey);
            formData.append('cuenta_id', cuentaIdInput.value);
            formData.append('centro_costo_id', centroCostoIdInput.value);
            formData.append('total', parseFloat(totalInput.value).toFixed(2));
            formData.append('comentarios', comentariosInput.value || '');
    
            try {
                console.log('Enviando solicitud a /agregar_cuenta con unique_key:', uniqueKey);
                const response = await fetch('/agregar_cuenta', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                console.log('Respuesta de /agregar_cuenta:', data);
                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${data.message || 'Error al agregar cuenta'}`);
                }
                if (data.success) {
                    await updateTable();
                    await updateTotals(); // Actualiza los totales después de agregar
                    clearForm();
                    // showSuccessToast('La cuenta se agregó con éxito'); // Línea comentada para eliminar el mensaje
                } else {
                    throw new Error(data.message || 'Error al agregar cuenta');
                }
            } catch (error) {
                console.error('Error al agregar cuenta:', error);
                showSuccessToast('Error: ' + error.message, true);
            }
        });
    }
    if (cuentasTable) {
        console.log('Adjuntando evento click a #cuentasTable');
        cuentasTable.addEventListener('click', async (e) => {
            e.preventDefault();
            const button = e.target.closest('button'); // Busca el botón más cercano
            if (!button) return; // Si no se encuentra un botón, salir
    
            const index = parseInt(button.dataset.index);
            const idCompraCuenta = button.dataset.idCompraCuenta;
    
            console.log('Botón clicado:', button.className, 'Índice:', index, 'ID Compra Cuenta:', idCompraCuenta);
    
            if (button.classList.contains('btn-modify')) {
                console.log('Botón Modificar clicado, índice:', index);
                try {
                    accounts = await fetchAccounts();
                    console.log('Cuentas obtenidas para modificar:', accounts);
                    if (!accounts[index]) {
                        throw new Error(`No se encontró la cuenta con índice ${index}`);
                    }
                    editingIndex = index;
                    const account = accounts[index];
                    originalData = { ...account };
    
                    cuentaInput.value = account.cuenta_nombre;
                    cuentaIdInput.value = account.id_cuenta;
                    centroCostoInput.value = account.centro_costo_nombre;
                    centroCostoIdInput.value = account.id_centro_costo;
                    totalInput.value = account.monto;
                    comentariosInput.value = account.comentarios || '';
                    actionButtons.style.display = 'none';
                    editButtons.style.display = 'block';
                    btnConfirmEdit.disabled = true;
                } catch (error) {
                    console.error('Error al intentar modificar cuenta:', error);
                    showSuccessToast('Error al cargar datos para modificar: ' + error.message, true);
                }
            }
    
            if (button.classList.contains('btn-delete')) {
                console.log('Botón Eliminar clicado, índice:', index);
                if (!deleteModal) {
                    console.error('Modal de eliminación no encontrado');
                    return;
                }
                deleteModal.style.display = 'flex';
                const modalContent = deleteModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.classList.add('show'); // Agrega la clase .show
                } else {
                    console.error('Contenido del modal de eliminación no encontrado');
                }
                btnConfirmDelete.dataset.index = index;
                btnConfirmDelete.dataset.idCompraCuenta = idCompraCuenta;
            }        });
    } else {
        console.error('No se encontró #cuentasTable en el DOM');
    }
    if (btnDiscard) btnDiscard.addEventListener('click', clearForm);

    if (btnConfirmEdit) {
        btnConfirmEdit.addEventListener('click', async () => {
            if (editingIndex !== null) {
                const formData = new FormData();
                formData.append('unique_key', uniqueKey);
                formData.append('cuenta_id', cuentaIdInput.value);
                formData.append('centro_costo_id', centroCostoIdInput.value);
                formData.append('total', parseFloat(totalInput.value).toFixed(2));
                formData.append('comentarios', comentariosInput.value || '');

                try {
                    console.log('Enviando solicitud a /agregar_cuenta para modificar con unique_key:', uniqueKey);
                    const response = await fetch('/agregar_cuenta', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    console.log('Respuesta de /agregar_cuenta (modificar):', data);
                    if (data.success) {
                        await updateTable();
                        await updateTotals(); // Actualiza los totales después de modificar
                        clearForm();
                        showSuccessToast('La cuenta se actualizó con éxito');
                    } else {
                        throw new Error(data.message || 'Error al actualizar cuenta');
                    }
                } catch (error) {
                    console.error('Error al actualizar cuenta:', error);
                    showSuccessToast('Error: ' + error.message, true);
                }
            }
        });
    }

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', () => deleteModal.style.display = 'none');

    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
            const idCompraCuenta = btnConfirmDelete.dataset.idCompraCuenta;

            try {
                const formData = new FormData();
                formData.append('unique_key', uniqueKey);
                formData.append('id_compra_cuenta', idCompraCuenta);

                console.log('Enviando solicitud a /eliminar_cuenta con unique_key:', uniqueKey);
                const response = await fetch('/eliminar_cuenta', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                console.log('Respuesta de /eliminar_cuenta:', data);
                if (!data.success) {
                    throw new Error(data.message || 'Error al eliminar la cuenta');
                }

                await updateTable();
                await updateTotals(); // Actualiza los totales después de eliminar
                deleteModal.style.display = 'none';
                showSuccessToast('La cuenta se eliminó con éxito');

                // Si no quedan cuentas, ocultar la tabla
                if (data.remaining_accounts === 0) {
                    cuentasTable.style.display = 'none';
                }
            } catch (error) {
                console.error('Error al eliminar cuenta:', error);
                showSuccessToast('Error: ' + error.message, true);
            }
        });
    }

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

    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', checkForChanges);
            input.addEventListener('change', checkForChanges);
        }
    });

    if (totalInput) {
        totalInput.addEventListener('input', updateTotals);
        totalInput.addEventListener('change', updateTotals);
    }

    async function initializeTable() {
        console.log('Inicializando tabla con unique_key:', uniqueKey);
        await updateTable();
    }

    // Esperar a que uniqueKey esté disponible antes de inicializar la tabla
    if (uniqueKey) {
        initializeTable();
    } else {
        const waitForUniqueKey = setInterval(() => {
            if (uniqueKey) {
                clearInterval(waitForUniqueKey);
                initializeTable();
            }
        }, 100);
    }

    

/* ==================== 9. VALIDACIÓN DEL FORMULARIO AL ENVIAR ==================== */
if (form) {
    form.addEventListener('submit', async (e) => {
        const action = e.submitter?.getAttribute('value') || form.querySelector('button[name="action"][type="submit"]')?.getAttribute('value');
        if (!action) {
            console.error('No se pudo detectar la acción del formulario');
            showSuccessToast('Error: No se pudo determinar la acción del formulario.', true);
            e.preventDefault();
            return;
        }
        console.log('Acción detectada:', action);

        if (action === 'cargar') {
            return;
        } else if (action === 'enviar') {
            e.preventDefault();

            if (loadingAnimation) {
                loadingAnimation.style.display = 'block';
                console.log('Animación de carga mostrada para acción "enviar"');
            }

            try {
                if (!uniqueKey) {
                    throw new Error('Unique Key no está definido. Asegúrate de que se haya cargado correctamente.');
                }

                if (!montoInput) {
                    throw new Error('El elemento #monto no está definido. Verifica que el elemento con id="monto" exista en el HTML.');
                }

                const totalMonto = parseFloat(montoInput.value) || 0;
                if (isNaN(totalMonto) || totalMonto <= 0) {
                    throw new Error('El monto total debe ser un número mayor a 0.');
                }

                // Caso 1 y Caso 3: Verificar si hay datos en "Detalle Cuentas" que no han sido agregados
                const hasPendingData = cuentaIdInput.value && centroCostoIdInput.value && totalInput.value;
                if (hasPendingData) {
                    const cuentaId = cuentaIdInput.value;
                    const centroCostoId = centroCostoIdInput.value;
                    const total = parseFloat(totalInput.value);
                    const comentarios = comentariosInput.value || '';

                    // Validar los campos pendientes
                    if (!cuentaId || !centroCostoId || isNaN(total) || total <= 0) {
                        throw new Error('Los campos en "Detalle Cuentas" son inválidos. Asegúrate de que todos los campos requeridos estén completos y el monto sea mayor a 0.');
                    }

                    // Agregar la cuenta pendiente a la tabla
                    const formDataPending = new FormData();
                    formDataPending.append('unique_key', uniqueKey);
                    formDataPending.append('cuenta_id', cuentaId);
                    formDataPending.append('centro_costo_id', centroCostoId);
                    formDataPending.append('total', total.toFixed(2));
                    formDataPending.append('comentarios', comentarios);

                    console.log('Agregando cuenta pendiente antes de enviar con unique_key:', uniqueKey);
                    const response = await fetch('/agregar_cuenta', {
                        method: 'POST',
                        body: formDataPending
                    });
                    const data = await response.json();
                    console.log('Respuesta de /agregar_cuenta (pendiente):', data);
                    if (!data.success) {
                        throw new Error(data.message || 'Error al agregar la cuenta pendiente');
                    }

                    // Actualizar la tabla después de agregar la cuenta pendiente
                    await updateTable();
                }

                // Obtener las cuentas directamente desde el servidor antes de enviar
                console.log('Antes de fetchAccounts en submit, unique_key:', uniqueKey);
                accounts = await fetchAccounts();
                console.log('Cuentas obtenidas antes de enviar:', accounts);

                // Verificar si hay cuentas para enviar
                if (accounts.length === 0) {
                    throw new Error('Debes agregar al menos una cuenta antes de enviar.');
                }

                // Transformar las cuentas para que coincidan con lo que espera el backend
                const transformedAccounts = accounts.map(account => ({
                    cuenta_id: account.id_cuenta,
                    centro_costo_id: account.id_centro_costo,
                    total: parseFloat(account.monto),
                    comentarios: account.comentarios || ''
                }));
                console.log('Cuentas transformadas para enviar:', transformedAccounts);

                const sumaCuentas = transformedAccounts.reduce((sum, acc) => sum + parseFloat(acc.total), 0);
                const diferencia = totalMonto - sumaCuentas;
                if (Math.abs(diferencia) > 0.01) {
                    throw new Error(`El monto total (${totalMonto.toFixed(2)}) no coincide con la suma de las cuentas (${sumaCuentas.toFixed(2)}). Falta por distribuir: ${diferencia.toFixed(2)}.`);
                }

                const formData = new FormData(form);
                formData.set('action', action);
                // Asegurarse de que accounts_data se envíe correctamente
                formData.delete('accounts_data'); // Eliminar cualquier valor previo
                formData.append('accounts_data', JSON.stringify(transformedAccounts)); // Agregar las cuentas transformadas
                console.log('FormData antes de enviar:', Array.from(formData.entries()));

                console.log('Enviando formulario a /nueva_factura con unique_key:', uniqueKey);
                const response = await fetch(form.getAttribute('action') || '/nueva_factura', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (loadingAnimation) {
                    loadingAnimation.style.display = 'none';
                    console.log('Animación de carga oculta para acción "enviar"');
                }

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${data.message || 'Error desconocido'}`);
                }

                if (data.success) {
                    formSubmitted = true; // Marcar como enviado
                    showSuccessToast('Factura enviada exitosamente');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    throw new Error(data.message || 'Error al enviar la factura');
                }
            } catch (error) {
                if (loadingAnimation) {
                    loadingAnimation.style.display = 'none';
                    console.log('Animación de carga oculta debido a un error');
                }
                console.error('Error al procesar el formulario:', error);
                showSuccessToast('Error: ' + error.message, true);
            }
        }
    });
}
    /* ==================== 10. LIMPIAR TEMPORALES AL SALIR ==================== */
    window.addEventListener('beforeunload', (e) => {
        if (accounts.length > 0 && !formSubmitted) {
            console.log('Ejecutando /limpiar_temporales con unique_key:', uniqueKey);
            fetch('/limpiar_temporales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `unique_key=${encodeURIComponent(uniqueKey)}`
            });
        } else {
            console.log('No se ejecutó /limpiar_temporales. Cuentas:', accounts.length, 'Form submitted:', formSubmitted);
        }
    });

    if (form) {
        form.addEventListener('submit', (e) => {
            if (e.submitter?.value === 'enviar') {
                formSubmitted = true;
                console.log('Formulario marcado como enviado');
            }
        });
    }
});
