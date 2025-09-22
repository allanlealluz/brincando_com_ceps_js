document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([-23.55052, -46.633308], 12); // SP centro
    const locationList = document.getElementById('location-list');
    const cepInput = document.getElementById('cep-input');
    const cepButton = document.getElementById('cep-button');
    const feedbackMessage = document.getElementById('feedback-message');
    let markers = [];

    const parks = [
        { name: 'Ibirapuera Park', coords: [-23.587416, -46.657634] },
        { name: 'Villa-Lobos Park', coords: [-23.546111, -46.723611] },
        { name: 'Trianon Park', coords: [-23.561414, -46.655881] },
        { name: 'Burle Marx Park', coords: [-23.603333, -46.703611] },
        { name: 'Piqueri Park', coords: [-23.514167, -46.606944] }
    ];
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    function addMarker(park) {
        const marker = L.marker(park.coords).addTo(map).bindPopup(park.name);
        marker.on('click', () => {
            map.setView(park.coords, 14);
            highlightLocation(park.name);
        });
    }

    function highlightLocation(name) {
        const items = locationList.querySelectorAll('.location-item');
        items.forEach(item => {
            item.classList.toggle('highlight', item.textContent === name);
        });
    }

    function populateLocationList() {
        parks.forEach(park => {
            const li = document.createElement('li');
            li.classList.add('location-item');
            li.textContent = park.name;
            li.addEventListener('click', () => {
                map.setView(park.coords, 14);
                highlightLocation(park.name);
            });
            locationList.appendChild(li);
            addMarker(park);
        });
    }

    function fetchLocationByCEP(cep) {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(res => res.json())
            .then(data => {
                if (data.erro) {
                    feedbackMessage.textContent = 'CEP não encontrado.';
                    return;
                }

                const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
                feedbackMessage.textContent = `Endereço: ${endereco}`;

                return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}`);
            })
            .then(res => res ? res.json() : null)
            .then(results => {
                if (!results || results.length === 0) {
                    feedbackMessage.textContent += ' (sem coordenadas encontradas)';
                    return;
                }

                const { lat, lon } = results[0];
                const coords = [parseFloat(lat), parseFloat(lon)];
                markers.forEach(m => map.removeLayer(m));
                markers = [];
                const marker = L.marker(coords).addTo(map)
                    .bindPopup(`Localização encontrada`)
                    .openPopup();

                markers.push(marker);

                map.setView(coords, 15);
            })
            .catch(() => {
                feedbackMessage.textContent = 'Erro ao buscar o CEP.';
            });
    }
    populateLocationList();
    cepButton.addEventListener('click', () => {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length === 8) {
            fetchLocationByCEP(cep);
        } else {
            feedbackMessage.textContent = 'Por favor, insira um CEP válido.';
        }
    });
});
