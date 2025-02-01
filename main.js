import { regionData } from './data.js';

// Ajouter ce mapping au début du fichier
const regionMapping = {
    'FR-A': 'alsace',
    'FR-M': 'lorraine',
    'FR-G': 'champagne-ardenne',
    'FR-S': 'picardie',
    'FR-O': 'nord-pas-de-calais',
    'FR-Q': 'haute-normandie',
    'FR-P': 'basse-normandie',
    'FR-E': 'bretagne',
    'FR-R': 'pays-de-la-loire',
    'FR-F': 'centre',
    'FR-I': 'franche-comte',
    'FR-D': 'bourgogne',
    'FR-C': 'auvergne',
    'FR-T': 'poitou-charentes',
    'FR-L': 'limousin',
    'FR-B': 'aquitaine',
    'FR-N': 'midi-pyrenees',
    'FR-K': 'languedoc-roussillon',
    'FR-V': 'rhone-alpes',
    'FR-H': 'corse',
    'FR-U': 'provence-alpes-cote-dazur',
    'FR-J': 'ile-de-france'
};

document.addEventListener('DOMContentLoaded', () => {
    // Charger le SVG de la France
    fetch('france.svg')
        .then(response => response.text())
        .then(svgContent => {
            document.getElementById('map').innerHTML = svgContent;
            initializeMapInteractions();
            initializeCharts();
            initializeComparison();
            initializeTimeline();
            initializeProgressCircles();
        });
});

function initializeMapInteractions() {
    const paths = document.querySelectorAll('path');
    let activeRegion = null;

    paths.forEach(path => {
        path.addEventListener('click', (e) => {
            const svgId = e.target.id;
            const regionId = regionMapping[svgId];
            console.log('SVG ID:', svgId);
            console.log('Region ID mappé:', regionId);

            const data = regionData[regionId];
            console.log('Données trouvées:', data);

            if (activeRegion) {
                document.getElementById(activeRegion).style.fill = '#3a3a3a';
            }

            activeRegion = svgId;
            path.style.fill = '#ff6b6b';

            if (data) {
                updateRegionInfo(data);
                animateStats();
            } else {
                console.log('Aucune donnée trouvée pour la région:', regionId);
            }
        });

        path.addEventListener('mouseenter', (e) => {
            if (activeRegion !== e.target.id) {
                path.style.fill = '#ff6b6b80';
            }
        });

        path.addEventListener('mouseleave', (e) => {
            if (activeRegion !== e.target.id) {
                path.style.fill = '#3a3a3a';
            }
        });
    });
}

function updateRegionInfo(data) {
    const regionStats = document.getElementById('region-stats');
    console.log('Mise à jour des stats avec:', data); // Log pour débugger

    if (!regionStats) {
        console.error('Element region-stats non trouvé');
        return;
    }

    regionStats.innerHTML = `
        <h3>${data.nom}</h3>
        <div class="stat-grid">
            <div class="stat-item" style="opacity: 0">
                <span class="stat-label">Population immigrée</span>
                <span class="stat-value">${data.populationImmigree}</span>
            </div>
            <div class="stat-item" style="opacity: 0">
                <span class="stat-label">Part des immigrés</span>
                <span class="stat-value">${data.partImmigres}</span>
            </div>
            <div class="stat-item" style="opacity: 0">
                <span class="stat-label">Évolution annuelle</span>
                <span class="stat-value">${data.evolution}</span>
            </div>
            <div class="stat-item" style="opacity: 0">
                <span class="stat-label">Principales origines</span>
                <span class="stat-value">${data.principalesOrigines.join(', ')}</span>
            </div>
        </div>
    `;

    // Ajouter la visualisation
    const visualization = createPopulationVisualization(parseFloat(data.partImmigres.replace('%', '')));
    regionStats.appendChild(visualization);

    // Animation d'apparition
    gsap.from(visualization, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out"
    });
}

function animateStats() {
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

function initializeCharts() {
    // Création du graphique en barres SVG pour Top 5 Régions
    initTopRegionsChart();

    // Création du nuage de mots pour les origines principales
    createOriginsCloud();

    // Initialisation des cartes interactives
    initializeInteractiveCards();

    // Initialisation de la chronologie démographique
    initializeDemographyTimeline();
}

function initTopRegionsChart() {
    // Convertir les données en tableau et trier par population
    const regions = Object.values(regionData)
        .map(region => ({
            nom: region.nom,
            population: parseInt(region.populationImmigree.replace(/\s/g, ''))
        }))
        .sort((a, b) => b.population - a.population)
        .slice(0, 5);

    const maxPopulation = regions[0].population;
    const chartContainer = document.getElementById('topRegionsChart');

    regions.forEach(region => {
        const percentage = (region.population / maxPopulation) * 100;

        const barItem = document.createElement('div');
        barItem.className = 'bar-item';

        barItem.innerHTML = `
            <div class="bar-label">${region.nom}</div>
            <div class="bar-container">
                <div class="bar" style="width: ${percentage}%">
                    <span class="bar-value">${region.population.toLocaleString('fr-FR')} immigrés</span>
                </div>
            </div>
        `;

        chartContainer.appendChild(barItem);
    });
}

function createOriginsCloud() {
    const originsCloud = document.getElementById('originsCloud');
    if (!originsCloud) {
        console.error('Container originsCloud non trouvé');
        return;
    }

    // Données de population par pays d'origine (2023)
    const originPopulationData = {
        "Algérie": "1820000",
        "Maroc": "1510000",
        "Portugal": "620000",
        "Tunisie": "530000",
        "Italie": "380000",
        "Turquie": "370000",
        "Espagne": "290000",
        "Royaume-Uni": "280000",
        "Chine": "240000",
        "Allemagne": "220000",
        "Sénégal": "180000",
        "Belgique": "170000",
        "Roumanie": "160000",
        "Mali": "150000",
        "Côte d'Ivoire": "140000"
    };

    originsCloud.innerHTML = '';

    // Trouver la population maximale pour le calcul de l'échelle
    const maxPopulation = Math.max(...Object.values(originPopulationData).map(pop => parseInt(pop)));
    const minFontSize = 14;
    const maxFontSize = 32;

    // Créer et ajouter les tags
    Object.entries(originPopulationData)
        .sort((a, b) => parseInt(b[1]) - parseInt(a[1]))
        .forEach(([origin, population]) => {
            const tag = document.createElement('span');
            tag.className = 'origin-cloud-tag';

            // Calculer la taille de la police en fonction de la population
            const fontSize = minFontSize + (maxFontSize - minFontSize) *
                (parseInt(population) / maxPopulation);

            // Formater le nombre avec des séparateurs de milliers
            const formattedPopulation = parseInt(population).toLocaleString('fr-FR');

            // Création du contenu du tag avec tooltip
            tag.innerHTML = `
                ${origin}
                <span class="population-tooltip">
                    ${formattedPopulation} personnes
                </span>
            `;

            tag.style.fontSize = `${fontSize}px`;

            // Animation à l'apparition
            gsap.from(tag, {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: tag,
                    start: "top 90%"
                }
            });

            originsCloud.appendChild(tag);
        });

    // Les styles restent les mêmes
    const style = document.createElement('style');
    style.textContent = `
        .origin-cloud-tag {
            display: inline-block;
            padding: 8px 16px;
            margin: 5px;
            background-color: rgba(255, 107, 107, 0.1);
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }

        .origin-cloud-tag:hover {
            background-color: rgba(255, 107, 107, 0.2);
            transform: translateY(-2px);
        }

        .origin-cloud-tag .population-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 14px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            margin-bottom: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .origin-cloud-tag .population-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
        }

        .origin-cloud-tag:hover .population-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(-5px);
        }
    `;
    document.head.appendChild(style);
}

function initializeInteractiveCards() {
    console.log('Initializing interactive cards...'); // Debug

    // Mettre à jour la carte de démographie
    const demographyCard = document.getElementById('demographyCard');
    if (demographyCard) {
        const avgGrowth = calculateAverageGrowth();
        console.log('Average growth:', avgGrowth); // Debug

        const progressCircle = demographyCard.querySelector('.progress-circle');
        if (progressCircle) {
            progressCircle.dataset.value = Math.round(avgGrowth * 100);
            animateProgressCircle(progressCircle);
        } else {
            console.error('Progress circle not found in demographyCard');
        }
    } else {
        console.error('DemographyCard not found');
    }

    // Initialiser la timeline
    initializeTimeline();
}

function calculateAverageGrowth() {
    const growthRates = Object.values(regionData).map(region =>
        parseFloat(region.evolution.replace('+', '').replace('% par an', ''))
    );
    const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    return avgGrowth;
}

function animateProgressCircle(circle) {
    const value = parseInt(circle.dataset.value);
    const innerCircle = circle.querySelector('.progress-circle-inner');

    gsap.to(circle, {
        background: `conic-gradient(var(--accent-color) ${value * 3.6}deg, transparent ${value * 3.6}deg)`,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
            const progress = Math.round(gsap.getProperty(circle, "background").split(" ")[1] / 3.6);
            if (innerCircle) innerCircle.textContent = `${progress}%`;
        }
    });
}

function initializeComparison() {
    const selects = document.querySelectorAll('.region-select');
    const compareBtn = document.getElementById('compareBtn');
    const result = document.getElementById('comparisonResult');

    // Remplir les selects avec les régions
    Object.values(regionData).forEach(region => {
        selects.forEach(select => {
            const option = document.createElement('option');
            option.value = region.nom;
            option.textContent = region.nom;
            select.appendChild(option);
        });
    });

    compareBtn.addEventListener('click', () => {
        const region1 = Object.values(regionData).find(r => r.nom === selects[0].value);
        const region2 = Object.values(regionData).find(r => r.nom === selects[1].value);

        if (region1 && region2) {
            result.innerHTML = `
                <h3>Comparaison: ${region1.nom} vs ${region2.nom}</h3>
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-label">Population immigrée</span>
                        <span class="stat-value">${region1.populationImmigree} vs ${region2.populationImmigree}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Part des immigrés</span>
                        <span class="stat-value">${region1.partImmigres} vs ${region2.partImmigres}</span>
                    </div>
                </div>
            `;
            result.classList.add('active');
        }
    });
}

function initializeTimeline() {
    const slider = document.getElementById('yearSlider');
    const yearDisplay = document.getElementById('yearDisplay');
    const timelineContent = document.getElementById('timelineContent');

    if (!slider || !yearDisplay || !timelineContent) {
        console.error('Éléments de timeline manquants');
        return;
    }

    // Données historiques détaillées par année
    const historicalData = {
        1950: {
            title: "Reconstruction d'après-guerre",
            population: "1.7 millions",
            principauxPays: ["Italie", "Espagne", "Pologne"],
            contexte: "Main d'œuvre pour la reconstruction",
            politiques: "Création de l'Office national d'immigration"
        },
        1960: {
            title: "Boom économique",
            population: "2.3 millions",
            principauxPays: ["Algérie", "Portugal", "Espagne"],
            contexte: "Les Trente Glorieuses",
            politiques: "Accords bilatéraux de main d'œuvre"
        },
        1970: {
            title: "Pic migratoire",
            population: "3.9 millions",
            principauxPays: ["Portugal", "Algérie", "Espagne"],
            contexte: "Apogée de l'immigration de travail",
            politiques: "Création du regroupement familial"
        },
        1980: {
            title: "Transition politique",
            population: "4.2 millions",
            principauxPays: ["Portugal", "Algérie", "Maroc"],
            contexte: "Crise économique et changement politique",
            politiques: "Régularisation des sans-papiers"
        },
        1990: {
            title: "Diversification",
            population: "4.9 millions",
            principauxPays: ["Algérie", "Maroc", "Portugal"],
            contexte: "Chute du mur de Berlin",
            politiques: "Accords de Schengen"
        },
        2000: {
            title: "Nouvelle ère",
            population: "5.6 millions",
            principauxPays: ["Algérie", "Maroc", "Portugal"],
            contexte: "Mondialisation",
            politiques: "Création de la carte 'Compétences et Talents'"
        },
        2010: {
            title: "Mutations contemporaines",
            population: "5.9 millions",
            principauxPays: ["Algérie", "Maroc", "Portugal"],
            contexte: "Crises migratoires",
            politiques: "Réforme du droit d'asile"
        },
        2020: {
            title: "Période actuelle",
            population: "6.8 millions",
            principauxPays: ["Algérie", "Maroc", "Tunisie"],
            contexte: "Post-Covid",
            politiques: "Nouvelles politiques d'intégration"
        }
    };

    // Initialiser avec la valeur actuelle
    updateTimelineContent(slider.value, historicalData, timelineContent);

    // Mettre à jour lors du déplacement du slider
    slider.addEventListener('input', (e) => {
        const year = e.target.value;
        yearDisplay.textContent = year;
        updateTimelineContent(year, historicalData, timelineContent);
    });
}

function updateTimelineContent(year, historicalData, timelineContent) {
    // Trouver l'année la plus proche
    const nearestYear = Object.keys(historicalData)
        .reduce((prev, curr) =>
            Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
        );

    const data = historicalData[nearestYear];

    // Créer le contenu HTML avec les données
    timelineContent.innerHTML = `
        <div class="timeline-event" style="opacity: 0">
            <h4 class="year-title">${nearestYear} - ${data.title}</h4>
            <div class="timeline-data">
                <div class="timeline-stat">
                    <span class="stat-label">Population immigrée</span>
                    <span class="stat-value">${data.population}</span>
                </div>
                <div class="timeline-stat">
                    <span class="stat-label">Contexte historique</span>
                    <span class="stat-value">${data.contexte}</span>
                </div>
                <div class="timeline-stat">
                    <span class="stat-label">Politique migratoire</span>
                    <span class="stat-value">${data.politiques}</span>
                </div>
                <div class="timeline-stat">
                    <span class="stat-label">Principales origines</span>
                    <div class="origins-list">
                        ${data.principauxPays.map(pays =>
        `<span class="origin-tag">${pays}</span>`
    ).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Ajouter des styles spécifiques
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .timeline-event {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 10px;
        }
        .year-title {
            color: var(--accent-color);
            font-size: 1.5rem;
            margin-bottom: 20px;
        }
        .timeline-data {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .timeline-stat {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .stat-label {
            color: var(--accent-color);
            font-size: 0.9rem;
        }
        .stat-value {
            font-size: 1.1rem;
        }
        .origins-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
        }
        .origin-tag {
            background: rgba(255, 107, 107, 0.1);
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 0.9rem;
        }
    `;
    document.head.appendChild(styleSheet);

    // Animation de l'événement
    const event = timelineContent.querySelector('.timeline-event');
    gsap.fromTo(event,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
}

function initializeProgressCircles() {
    const circles = document.querySelectorAll('.progress-circle');

    circles.forEach(circle => {
        const value = parseInt(circle.dataset.value);
        animateProgress(circle, value);
    });
}

function animateProgress(element, targetValue) {
    let current = 0;
    const increment = targetValue / 100;

    const interval = setInterval(() => {
        current += increment;
        if (current >= targetValue) {
            current = targetValue;
            clearInterval(interval);
        }

        element.style.background = `conic-gradient(
            var(--accent-color) ${current * 3.6}deg,
            transparent ${current * 3.6}deg
        )`;
        element.querySelector('.progress-circle-inner').textContent =
            Math.round(current) + '%';
    }, 20);
}

function createLoader() {
    const loader = document.createElement('div');
    loader.classList.add('loader-container');

    loader.innerHTML = `
        <div class="ocean-scene">
            <div class="sky">
                <div class="stars"></div>
                <div class="moon"></div>
            </div>
            <div class="boat">
                <div class="zodiac">
                    <div class="motor">
                        <div class="motor-body"></div>
                        <div class="propeller"></div>
                    </div>
                    <div class="hull">
                        <div class="people">
                            <div class="person person1">
                                <div class="head"></div>
                                <div class="body"></div>
                                <div class="arms">
                                    <div class="arm left"></div>
                                    <div class="arm right"></div>
                                </div>
                            </div>
                            <div class="person person2">
                                <div class="head"></div>
                                <div class="body"></div>
                                <div class="arms">
                                    <div class="arm left"></div>
                                    <div class="arm right"></div>
                                </div>
                            </div>
                        </div>
                        <div class="tube"></div>
                        <div class="tube-marks"></div>
                        <div class="floor"></div>
                    </div>
                </div>
            </div>
            <div class="ocean">
                <div class="waves">
                    <div class="wave wave1"></div>
                    <div class="wave wave2"></div>
                    <div class="wave wave3"></div>
                </div>
                <div class="bubbles"></div>
            </div>
        </div>
    `;

    document.body.appendChild(loader);

    const style = document.createElement('style');
    style.textContent = `
        .loader-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .ocean-scene {
            width: 300px;
            height: 300px;
            position: relative;
            overflow: hidden;
            background: linear-gradient(180deg, #1a1a1a 0%, #0a4958 100%);
        }

        .boat {
            position: absolute;
            width: 120px;
            height: 60px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            animation: float 3s infinite ease-in-out;
        }

        .zodiac {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .hull {
            position: relative;
            width: 100%;
            height: 100%;
        }

        .tube {
            position: absolute;
            width: 100%;
            height: 25px;
            bottom: 0;
            background: #2C3E50;
            border-radius: 15px 15px 0 0;
        }

        .floor {
            position: absolute;
            width: 80%;
            height: 15px;
            bottom: 15px;
            left: 10%;
            background: #34495E;
        }

        .motor {
            position: absolute;
            right: -10px;
            bottom: 15px;
            width: 20px;
            height: 35px;
            background: #2C3E50;
        }

        .people {
            position: absolute;
            width: 100%;
            height: 40px;
            bottom: 15px;
            display: flex;
            justify-content: space-around;
            z-index: 2;
        }

        .person {
            position: relative;
            width: 20px;
            height: 35px;
        }

        .head {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #FFE0BD;
            border-radius: 50%;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
        }

        .body {
            position: absolute;
            width: 16px;
            height: 20px;
            background: #3498db;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 4px 4px 0 0;
        }

        .ocean {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 40%;
            background: #0a4958;
        }

        .waves {
            position: absolute;
            top: 0;
            width: 100%;
            height: 100%;
        }

        .wave {
            position: absolute;
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            animation: wave 2s infinite linear;
        }

        .wave1 { top: 0; }
        .wave2 { top: 10px; animation-delay: 0.5s; }
        .wave3 { top: 20px; animation-delay: 1s; }

        @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            50% { transform: translate(-50%, -55%) rotate(2deg); }
        }

        @keyframes wave {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
        }

        .loader-container.hidden .boat {
            animation: sinkBoat 2s forwards;
        }

        @keyframes sinkBoat {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, 100%) rotate(-45deg); }
        }
    `;
    document.head.appendChild(style);

    // Attendre que la page soit chargée
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.remove();
            }, 2000);
        }, 1000);
    });
}

// Appeler la fonction immédiatement
createLoader();

function createPopulationVisualization(percentage) {
    const svgContainer = document.createElement('div');
    svgContainer.className = 'population-visualization';

    // Calculer le nombre exact de personnes pour chaque catégorie
    const totalFigures = 100;
    const fullImmigrantFigures = Math.floor(percentage);
    const partialFigure = percentage - fullImmigrantFigures;
    const nativeFigures = totalFigures - Math.ceil(percentage);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('viewBox', '0 0 1000 200');
    svg.setAttribute('class', 'population-svg');

    function createPersonIcon(x, y, type, partialPercentage = null) {
        const person = document.createElementNS("http://www.w3.org/2000/svg", "g");
        person.setAttribute('transform', `translate(${x}, ${y})`);
        person.setAttribute('class', `person ${type}`);

        const bodyGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        bodyGroup.setAttribute('transform', 'scale(1.2)');

        const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        head.setAttribute('cx', '10');
        head.setAttribute('cy', '7');
        head.setAttribute('r', '7');

        const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
        body.setAttribute('d', `
            M 10 14
            L 10 35
            M 10 20
            L 2 30
            M 10 20
            L 18 30
            M 10 35
            L 2 48
            M 10 35
            L 18 48
        `);
        body.setAttribute('stroke-width', '3');
        body.setAttribute('stroke-linecap', 'round');

        if (type === 'partial' && partialPercentage !== null) {
            const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
            gradient.setAttribute('id', `partial-${x}-${y}`);
            gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
            gradient.setAttribute('x1', '0');
            gradient.setAttribute('y1', '0');
            gradient.setAttribute('x2', '0');
            gradient.setAttribute('y2', '48');

            const transitionPoint = (1 - partialPercentage) * 100;

            gradient.innerHTML = `
                <stop offset="0%" stop-color="#000000"/>
                <stop offset="${transitionPoint}%" stop-color="#000000"/>
                <stop offset="${transitionPoint}%" stop-color="#2196F3"/>
                <stop offset="100%" stop-color="#2196F3"/>
            `;

            person.appendChild(gradient);
            const fillColor = `url(#partial-${x}-${y})`;
            head.setAttribute('fill', fillColor);
            body.setAttribute('stroke', fillColor);
        } else {
            const color = type === 'immigrant' ? '#000000' : '#2196F3';
            head.setAttribute('fill', color);
            body.setAttribute('stroke', color);
        }

        bodyGroup.appendChild(head);
        bodyGroup.appendChild(body);
        person.appendChild(bodyGroup);

        return person;
    }

    // Configuration de la grille
    const iconsPerRow = 20;
    const iconWidth = 40;
    const iconHeight = 40;
    let currentX = 10;
    let currentY = 10;
    let count = 0;

    // Placer les icônes immigrées pleines
    for (let i = 0; i < fullImmigrantFigures; i++) {
        if (count % iconsPerRow === 0 && count !== 0) {
            currentX = 10;
            currentY += iconHeight;
        }
        svg.appendChild(createPersonIcon(currentX, currentY, 'immigrant'));
        currentX += iconWidth;
        count++;
    }

    // Placer l'icône partielle si nécessaire
    if (partialFigure > 0) {
        if (count % iconsPerRow === 0) {
            currentX = 10;
            currentY += iconHeight;
        }
        svg.appendChild(createPersonIcon(currentX, currentY, 'partial', partialFigure));
        currentX += iconWidth;
        count++;
    }

    // Placer les icônes natives
    for (let i = 0; i < nativeFigures; i++) {
        if (count % iconsPerRow === 0) {
            currentX = 10;
            currentY += iconHeight;
        }
        svg.appendChild(createPersonIcon(currentX, currentY, 'native'));
        currentX += iconWidth;
        count++;
    }

    svgContainer.appendChild(svg);

    // Légende avec pourcentages précis
    const legend = document.createElement('div');
    legend.className = 'population-legend';
    legend.innerHTML = `
        <div class="legend-item">
            <div class="legend-color immigrant"></div>
            <span>Population immigrée (${percentage.toFixed(1)}%)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color native"></div>
            <span>Population non-immigrée (${(100 - percentage).toFixed(1)}%)</span>
        </div>
    `;
    svgContainer.appendChild(legend);

    // Les styles restent les mêmes
    const style = document.createElement('style');
    style.textContent = `
        .population-visualization {
            margin: 20px 0;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
        }

        .population-svg {
            width: 100%;
            height: auto;
        }

        .person {
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .person circle, .person path {
            transition: all 0.3s ease;
        }

        .population-legend {
            margin-top: 15px;
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: .8rem;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .legend-color.immigrant {
            background:rgb(0, 0, 0);
        }


        .legend-color.native {
            background: #2196F3;
        }
    `;
    document.head.appendChild(style);

    return svgContainer;
}

// Modifier la fonction qui gère le clic sur une région
function handleRegionClick(region) {
    const regionStats = document.getElementById('region-stats');
    if (!regionStats) return;

    const regionData = getRegionData(region.id);
    if (!regionData) return;

    // Afficher les statistiques existantes
    regionStats.innerHTML = `
        <h3>${regionData.nom}</h3>
        <p>Population totale: ${regionData.population}</p>
        <p>Part des immigrés: ${regionData.partImm}%</p>
    `;

    // Ajouter la visualisation
    const visualization = createPopulationVisualization(parseFloat(regionData.partImm));
    regionStats.appendChild(visualization);

    // Animation d'apparition
    gsap.from(visualization, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: "power2.out"
    });
}

function initializeDemographyTimeline() {
    const slider = document.getElementById('demographySlider');
    const yearDisplay = document.getElementById('demographyYearDisplay');
    const demographyContent = document.getElementById('demographyContent');

    if (!slider || !yearDisplay || !demographyContent) {
        console.error('Éléments de démographie manquants');
        return;
    }

    // Données démographiques par année et par région
    const demographyData = {
        1950: {
            'ile-de-france': { population: '800000', evolution: '+1.2%' },
            'rhone-alpes': { population: '250000', evolution: '+0.8%' },
            'paca': { population: '200000', evolution: '+1.0%' },
            'midi-pyrenees': { population: '150000', evolution: '+0.7%' }
        },
        1960: {
            'ile-de-france': { population: '1200000', evolution: '+2.5%' },
            'rhone-alpes': { population: '350000', evolution: '+1.8%' },
            'paca': { population: '300000', evolution: '+2.0%' },
            'midi-pyrenees': { population: '200000', evolution: '+1.7%' }
        },
        1970: {
            'ile-de-france': { population: '1800000', evolution: '+3.0%' },
            'rhone-alpes': { population: '450000', evolution: '+2.3%' },
            'paca': { population: '400000', evolution: '+2.5%' },
            'midi-pyrenees': { population: '220000', evolution: '+1.9%' }
        },
        1980: {
            'ile-de-france': { population: '2000000', evolution: '+1.5%' },
            'rhone-alpes': { population: '500000', evolution: '+1.2%' },
            'paca': { population: '450000', evolution: '+1.3%' },
            'midi-pyrenees': { population: '230000', evolution: '+0.8%' }
        },
        1990: {
            'ile-de-france': { population: '2200000', evolution: '+1.2%' },
            'rhone-alpes': { population: '525000', evolution: '+1.0%' },
            'paca': { population: '475000', evolution: '+1.1%' },
            'nord-pas-de-calais': { population: '235000', evolution: '+0.7%' }
        },
        2000: {
            'ile-de-france': { population: '2400000', evolution: '+1.0%' },
            'rhone-alpes': { population: '550000', evolution: '+0.9%' },
            'paca': { population: '490000', evolution: '+0.8%' },
            'midi-pyrenees': { population: '238000', evolution: '+0.6%' }
        },
        2010: {
            'ile-de-france': { population: '2600000', evolution: '+1.1%' },
            'rhone-alpes': { population: '565000', evolution: '+1.0%' },
            'paca': { population: '500000', evolution: '+0.9%' },
            'nord-pas-de-calais': { population: '240000', evolution: '+0.7%' }
        },
        2020: {
            'ile-de-france': { population: '2800000', evolution: '+1.3%' },
            'rhone-alpes': { population: '575000', evolution: '+1.7%' },
            'paca': { population: '504000', evolution: '+1.3%' },
            'midi-pyrenees': { population: '242000', evolution: '+1.3%' }
        }
    };

    // Initialiser avec la valeur actuelle
    updateDemographyContent(slider.value, demographyData, demographyContent);

    // Mettre à jour lors du déplacement du slider
    slider.addEventListener('input', (e) => {
        const year = e.target.value;
        yearDisplay.textContent = year;
        updateDemographyContent(year, demographyData, demographyContent);
    });
}

function updateDemographyContent(year, demographyData, demographyContent) {
    const nearestYear = Object.keys(demographyData)
        .reduce((prev, curr) =>
            Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
        );

    const data = demographyData[nearestYear];
    const regions = Object.entries(data).sort((a, b) =>
        parseInt(b[1].population) - parseInt(a[1].population)
    );

    demographyContent.innerHTML = `
        <div class="demography-event" style="opacity: 0">
            <div class="demography-grid">
                ${regions.map(([region, stats]) => `
                    <div class="region-stat">
                        <h4>${formatRegionName(region)}</h4>
                        <div class="stat-details">
                            <div class="stat-item">
                                <span class="stat-label">Population</span>
                                <span class="stat-value">${formatNumber(stats.population)}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Évolution</span>
                                <span class="stat-value">${stats.evolution}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Animation de l'événement
    const event = demographyContent.querySelector('.demography-event');
    gsap.fromTo(event,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );
}

function formatRegionName(region) {
    const names = {
        'ile-de-france': 'Île-de-France',
        'rhone-alpes': 'Rhône-Alpes',
        'paca': 'Provence-Alpes-Côte d\'Azur',
        'midi-pyrenees': 'Midi-Pyrénées'
    };
    return names[region] || region;
}

function formatNumber(num) {
    return parseInt(num).toLocaleString('fr-FR');
} 