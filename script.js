document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');
    let allCommands = []; // Pour stocker nos commandes globalement
    let knowledgeBase = []; // Pour stocker notre base de connaissances
    let procedures = []; // Pour stocker nos tutos et procédures
    let favoriteItems = JSON.parse(localStorage.getItem('bashFavorites')) || []; // Initialisation du LocalStorage

    // --- SYSTEME DE THEME (DARK/LIGHT MODE) ---
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Vérification du thème initial
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        themeToggleLightIcon.classList.remove('hidden');
        document.documentElement.classList.add('dark');
    } else {
        themeToggleDarkIcon.classList.remove('hidden');
        document.documentElement.classList.remove('dark');
    }

    themeToggleBtn.addEventListener('click', function() {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    });

    // Fonction pour charger les commandes depuis le fichier JSON
    async function loadCommands() {
        try {
            const response = await fetch('./bashCommands.json');
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            allCommands = await response.json();
            console.log("Commandes chargées :", allCommands);
        } catch (error) {
            console.error("Erreur lors du chargement des commandes :", error);
        }
    }

    // Fonction pour charger la base de connaissances
    async function loadKnowledgeBase() {
        try {
            const response = await fetch('./knowledgeBase.json');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            knowledgeBase = await response.json();
        } catch (error) {
            console.error("Erreur lors du chargement de la base de connaissances :", error);
        }
    }

    // Fonction pour charger les procédures
    async function loadProcedures() {
        try {
            const response = await fetch('./procedures.json');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            procedures = await response.json();
        } catch (error) {
            console.error("Erreur lors du chargement des procédures :", error);
        }
    }

    // --- SYSTEME DE NAVIGATION ---
    // Fonction attachée à "window" pour pouvoir être appelée depuis les onclick HTML
    window.navigate = function(moduleId, updateHistory = true) {
        if (moduleId === 'home') {
            renderDashboard();
        } else if (moduleId === 'catalog') {
            renderCatalog(allCommands);
        } else if (moduleId === 'generator') {
            renderGenerator();
        } else if (moduleId === 'knowledge') {
            renderKnowledgeBaseView();
        } else if (moduleId === 'procedures') {
            renderProcedures();
        } else if (moduleId === 'favorites') {
            renderFavorites();
        } else if (moduleId === 'links') {
            renderLinks();
        } else {
            // Page en construction
            appContainer.innerHTML = `
                <div class="text-center py-16">
                    <div class="inline-block p-4 bg-white dark:bg-slate-900 rounded-full border border-slate-300 dark:border-slate-800 mb-4 text-slate-400 dark:text-slate-500">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-300 mb-2">Module en construction</h2>
                    <p class="text-slate-500 mb-8">Cette section sera bientôt disponible.</p>
                    <button onclick="navigate('home')" class="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Retour au Dashboard
                    </button>
                </div>
            `;
        }

        // Ajout de l'historique de navigation
        if (updateHistory) {
            history.pushState({ view: moduleId }, '', `#${moduleId}`);
        }
    };

    // Écouteur sur le bouton "Précédent/Suivant" (Souris/Navigateur)
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.view) {
            window.navigate(event.state.view, false);
        } else {
            window.navigate('home', false);
        }
    });

    // Fonction globale pour copier du texte et animer le bouton
    window.copyCommand = function(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = btnElement.innerHTML;
            btnElement.innerHTML = `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            setTimeout(() => {
                btnElement.innerHTML = originalHTML;
            }, 2000);
        }).catch(err => console.error("Erreur lors de la copie:", err));
    };

    // Fonction globale pour gérer les favoris (Ajout/Suppression)
    window.toggleFavorite = function(id, type, dataBase64, btnElement) {
        const data = JSON.parse(decodeURIComponent(dataBase64));
        const index = favoriteItems.findIndex(item => item.id === id && item.type === type);
        
        if (index > -1) {
            favoriteItems.splice(index, 1);
            btnElement.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`;
            btnElement.classList.replace('text-amber-500', 'text-slate-500');
            btnElement.classList.replace('dark:text-amber-400', 'text-slate-500');
        } else {
            favoriteItems.push({ id, type, ...data });
            btnElement.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>`;
            btnElement.classList.replace('text-slate-500', 'text-amber-500');
            btnElement.classList.add('dark:text-amber-400');
        }
        localStorage.setItem('bashFavorites', JSON.stringify(favoriteItems));
        
        // Si on est sur la page des favoris, on met à jour l'affichage en direct
        if (window.location.hash === '#favorites') renderFavorites();
    };

    // Fonction pour générer le Dashboard (Page d'accueil)
    function renderDashboard() {
        const tiles = [
            {
                id: 'catalog',
                title: 'Catalogue des Commandes',
                desc: 'Dictionnaire interactif des commandes Linux de base avec syntaxe et arguments.',
                icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>',
                color: 'text-emerald-400'
            },
            {
                id: 'knowledge',
                title: 'Base de connaissances',
                desc: 'Fiches réflexes : théorie, commandes exactes et pièges à éviter.',
                icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>',
                color: 'text-blue-400'
            },
            {
                id: 'procedures',
                title: 'Tutos & Procédures',
                desc: 'Guides pas-à-pas interactifs pour vos déploiements et astuces système.',
                icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>',
                color: 'text-pink-600 dark:text-pink-400'
            },
            {
                id: 'generator',
                title: 'Générateur Bash (beta)',
                desc: 'Assistant visuel pour construire des commandes complexes sans erreur de syntaxe (ex: find, tar).',
                icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>',
                color: 'text-purple-400'
            },
            {
                id: 'quiz',
                title: 'Terminal Quiz',
                desc: 'Testez vos connaissances en administration système Linux via un mode QCM ludique.',
                icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>',
                color: 'text-amber-400'
            },
            {
                id: 'links',
                title: 'Projets & Liens',
                desc: 'Raccourcis vers vos autres outils d\'administration et ressources d\'apprentissage ludique.',
                icon: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>',
                color: 'text-indigo-500 dark:text-indigo-400'
            }
        ];

        const gridHtml = `
            <!-- Bandeau de présentation (Hero section) -->
            <div class="mb-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-8 relative overflow-hidden shadow-sm dark:shadow-lg dark:shadow-black/20">
                <div class="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <h2 class="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4 relative z-10">Maîtrisez votre environnement Linux.</h2>
                <p class="text-slate-600 dark:text-slate-400 text-lg max-w-3xl leading-relaxed relative z-10">
                    <span class="text-emerald-600 dark:text-emerald-400 font-mono">~/Outil_Bash</span> est votre couteau suisse pour l'administration système. Retrouvez instantanément la syntaxe exacte de vos commandes, révisez la théorie grâce aux fiches réflexes.
                </p>
            </div>

            <div class="mb-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${tiles.map(tile => `
                        <div class="group bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-xl p-6 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all cursor-pointer flex flex-col h-full" onclick="navigate('${tile.id}')">
                            <div class="flex items-center gap-4 mb-4">
                                <div class="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-800 group-hover:border-emerald-500/30 transition-colors ${tile.color}">
                                    ${tile.icon}
                                </div>
                                <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">${tile.title}</h3>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400 leading-relaxed flex-grow">${tile.desc}</p>
                            
                            <div class="mt-6 flex justify-end">
                                <span class="text-sm font-mono text-slate-500 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                    Lancer le module
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        appContainer.innerHTML = gridHtml;
    }

    // --- MODULE 1 : CATALOGUE ---
    function renderCatalog(commands) {
        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;
        
        if (commands.length === 0) {
            appContainer.innerHTML = backBtn + `<p class="text-slate-400 text-center py-8">Aucune commande trouvée.</p>`;
            return;
        }

        const categories = ['Toutes', ...new Set(commands.map(c => c.category))];

        const gridHtml = `
            ${backBtn}
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-300 dark:border-slate-800 pb-6">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Dictionnaire des commandes</h2>
                
                <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                    <label class="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <input type="checkbox" id="cat-advanced" class="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-emerald-500">
                        Avancé
                    </label>
                    <div class="relative w-full md:w-64">
                        <input type="text" id="cat-search" placeholder="Rechercher (ex: grep, ip, réseau...)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors text-sm">
                        <svg class="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    
                    <div class="relative w-full md:w-48">
                        <select id="cat-filter" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-4 pr-10 py-2 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors text-sm appearance-none">
                            ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                        <svg class="w-4 h-4 absolute right-3 top-2.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            <div id="catalog-grid" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
        `;
        
        appContainer.innerHTML = gridHtml;

        const searchInput = document.getElementById('cat-search');
        const filterSelect = document.getElementById('cat-filter');
        const advancedToggle = document.getElementById('cat-advanced');
        
        searchInput.addEventListener('input', updateCatalogGrid);
        filterSelect.addEventListener('change', updateCatalogGrid);
        advancedToggle.addEventListener('change', updateCatalogGrid);

        function updateCatalogGrid() {
            const query = searchInput.value.toLowerCase();
            const category = filterSelect.value;
            const showAdvanced = advancedToggle.checked;
            
            const filtered = commands.filter(cmd => {
                const matchesQuery = cmd.name.toLowerCase().includes(query) || 
                                     cmd.description.toLowerCase().includes(query) || 
                                     cmd.tags.some(t => t.toLowerCase().includes(query));
                const matchesCategory = category === 'Toutes' || cmd.category === category;
                const matchesAdvanced = showAdvanced || !cmd.advanced;
                return matchesQuery && matchesCategory && matchesAdvanced;
            });
            
            const grid = document.getElementById('catalog-grid');
            
            if(filtered.length === 0) {
                grid.innerHTML = `<div class="col-span-1 md:col-span-2 text-center text-slate-500 py-8 border border-dashed border-slate-800 rounded-xl">Aucune commande ne correspond à votre recherche.</div>`;
                return;
            }

            // Cartographie des couleurs pour les petits badges
            const badgeColors = {
                "Fichiers & Dossiers": "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50",
                "Navigation": "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50",
                "Droits & Permissions": "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50",
                "Recherche & Texte": "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50",
                "Administration": "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50",
                "Réseau": "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50",
                "Processus & Système": "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50"
            };

            grid.innerHTML = filtered.map(cmd => {
                const badgeTheme = badgeColors[cmd.category] || "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
                
                const isFav = favoriteItems.some(f => f.id === cmd.name && f.type === 'command');
                const starIcon = isFav ? `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>` : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`;
                const starColorClass = isFav ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500';
                const payload = encodeURIComponent(JSON.stringify({ name: cmd.name, desc: cmd.description, example: cmd.example, category: cmd.category }));
                
                return `
                    <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl p-6 transition-colors flex flex-col h-full shadow-sm dark:shadow-lg dark:shadow-black/20 group">
                        <div class="flex justify-between items-start mb-4">
                            <h2 class="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200">${cmd.name}</h2>
                            <span class="${badgeTheme} text-xs px-3 py-1 rounded-full border shadow-sm">${cmd.category}</span>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">${cmd.description}</p>
                        <div class="bg-slate-100 dark:bg-black/40 rounded-lg p-3 font-mono text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800/50 flex justify-between items-center gap-4">
                            <div class="overflow-x-auto whitespace-nowrap hide-scrollbar flex-grow">
                                <span class="text-emerald-500 dark:text-emerald-500/50 mr-2">$</span>${cmd.example}
                            </div>
                            <div class="flex gap-2">
                                <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${cmd.example.replace(/"/g, '&quot;')}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                                <button onclick="toggleFavorite('${cmd.name}', 'command', '${payload}', this)" class="${starColorClass} hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Ajouter aux favoris">
                                    ${starIcon}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Lancement de l'affichage initial
        updateCatalogGrid();
    }

    // --- MODULE 2 : BASE DE CONNAISSANCES ---
    function renderKnowledgeBaseView() {
        let currentActiveFicheId = null;
        const categories = ['Toutes', ...new Set(knowledgeBase.map(f => f.category))];

        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;

        appContainer.innerHTML = `
            ${backBtn}
            <div class="flex flex-col lg:flex-row gap-8 lg:h-[850px]">
                <!-- Sidebar -->
                <div class="w-full lg:w-1/3 flex flex-col gap-3">
                    <div class="flex gap-2">
                        <div class="relative flex-grow">
                            <select id="kb-filter" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-3 pr-8 py-2 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors text-sm appearance-none">
                                ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                            <svg class="w-4 h-4 absolute right-2 top-2.5 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                        <label class="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
                            <input type="checkbox" id="kb-advanced" class="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-emerald-500">
                            Avancé
                        </label>
                    </div>
                    <div class="relative">
                        <input type="text" id="kb-search" placeholder="Rechercher (ex: Apache, chmod...)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-800 dark:text-slate-300 focus:outline-none focus:border-emerald-500 transition-colors text-sm">
                        <svg class="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div id="kb-sidebar-list" class="flex-grow bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 overflow-y-auto shadow-sm dark:shadow-none">
                        <!-- Dynamiquement rempli par la recherche -->
                    </div>
                </div>

                <!-- Content Area -->
                <div class="w-full lg:w-2/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 lg:p-8 overflow-y-auto shadow-sm dark:shadow-lg dark:shadow-black/20" id="kb-content-area">
                    <div class="flex h-full items-center justify-center text-slate-500 flex-col gap-4">
                        <svg class="w-16 h-16 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        <p>Sélectionnez une fiche dans le menu pour afficher son contenu.</p>
                    </div>
                </div>
            </div>
        `;

        const searchInput = document.getElementById('kb-search');
        const filterSelect = document.getElementById('kb-filter');
        const advancedToggle = document.getElementById('kb-advanced');

        const updateData = () => updateKBSidebar();
        searchInput.addEventListener('input', updateData);
        filterSelect.addEventListener('change', updateData);
        advancedToggle.addEventListener('change', updateData);

        function updateKBSidebar() {
            const listContainer = document.getElementById('kb-sidebar-list');
            const lowerQuery = searchInput.value.toLowerCase();
            const category = filterSelect.value;
            const showAdvanced = advancedToggle.checked;

            // Filtrage sur titre, description, catégorie et code
            const filtered = knowledgeBase.filter(f => {
                const matchesQuery = f.title.toLowerCase().includes(lowerQuery) || f.description.toLowerCase().includes(lowerQuery) || f.category.toLowerCase().includes(lowerQuery) || f.commands.some(c => c.code.toLowerCase().includes(lowerQuery));
                const matchesCategory = category === 'Toutes' || f.category === category;
                const matchesAdvanced = showAdvanced || !f.advanced;
                return matchesQuery && matchesCategory && matchesAdvanced;
            });

            // Groupement par catégories
            const grouped = filtered.reduce((acc, fiche) => {
                if (!acc[fiche.category]) acc[fiche.category] = [];
                acc[fiche.category].push(fiche);
                return acc;
            }, {});

            if (Object.keys(grouped).length === 0) {
                listContainer.innerHTML = '<p class="text-sm text-slate-500 text-center mt-4">Aucune fiche trouvée.</p>';
                return;
            }

            let html = '';
            for (const [category, fiches] of Object.entries(grouped)) {
                html += `<div class="mb-5 last:mb-0">
                            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-2 border-l-2 border-emerald-500/30">${category}</h3>
                            <ul class="space-y-1">`;
                fiches.forEach(fiche => {
                    const isActive = currentActiveFicheId === fiche.id;
                    html += `<li>
                                <button class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors kb-fiche-btn ${isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}" data-id="${fiche.id}">
                                    ${fiche.title}
                                </button>
                             </li>`;
                });
                html += `   </ul>
                         </div>`;
            }
            listContainer.innerHTML = html;

            // Attacher les events aux boutons
            listContainer.querySelectorAll('.kb-fiche-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentActiveFicheId = e.currentTarget.getAttribute('data-id');
                    openFiche(currentActiveFicheId);
                    updateKBSidebar();
                });
            });
        }

        function openFiche(id) {
            const fiche = knowledgeBase.find(f => f.id === id);
            if (!fiche) return;
            const contentArea = document.getElementById('kb-content-area');
            const descHtml = fiche.description.replace(/\n/g, '<br/>');

            let alertHtml = '';
            if (fiche.alert) {
                const isWarning = fiche.alertType === 'warning';
                const alertColor = isWarning ? 'text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20' : 'text-blue-800 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-400/10 dark:border-blue-400/20';
                const icon = isWarning 
                    ? '<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
                    : '<svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

                alertHtml = `
                    <div class="flex gap-3 p-4 rounded-lg border ${alertColor} mb-8">
                        ${icon}
                        <p class="text-sm leading-relaxed">${fiche.alert}</p>
                    </div>
                `;
            }

            const commandsHtml = fiche.commands.map(cmd => `
                <div class="mb-6 last:mb-0">
                    ${cmd.note ? `<p class="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">${cmd.note}</p>` : ''}
                    <div class="bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-800 rounded-lg p-4 group relative flex justify-between items-start gap-4">
                        <code class="text-emerald-600 dark:text-emerald-400 font-mono text-sm break-words whitespace-pre-wrap flex-grow">${cmd.code}</code>
                        <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${cmd.code.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                </div>
            `).join('');

            contentArea.innerHTML = `
                <div>
                    <span class="inline-block px-3 py-1 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-xs mb-4">
                        ${fiche.category}
                    </span>
                    <h2 class="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">${fiche.title}</h2>
                    
                    <div class="text-slate-700 dark:text-slate-300 leading-relaxed mb-8 text-lg">
                        ${descHtml}
                    </div>

                    ${alertHtml}

                    ${commandsHtml ? `
                    <div class="space-y-4">
                        <h3 class="text-xl font-bold text-slate-800 dark:text-slate-300 mb-4 border-b border-slate-300 dark:border-slate-800 pb-2">Commandes associées</h3>
                        ${commandsHtml}
                    </div>
                    ` : ''}
                </div>
            `;
        }

        // Initialisation de la vue avec la liste complète
        updateKBSidebar();
    }

    // --- MODULE 3 : GÉNÉRATEUR (TAR) ---
    function renderGenerator() {
        const html = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>

            <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-lg dark:shadow-black/20">
                <div class="flex items-center gap-4 mb-8 border-b border-slate-300 dark:border-slate-800 pb-4">
                    <div class="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-800 text-purple-600 dark:text-purple-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Générateur : Archivage <span class="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-1 rounded">tar</span></h2>
                        <p class="text-slate-600 dark:text-slate-400 mt-1">Générez la syntaxe exacte pour compresser ou extraire vos fichiers.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Zone de configuration -->
                    <div class="space-y-6">
                        <!-- Choix de l'action -->
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">1. Action principale</label>
                            <div class="flex gap-4">
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-action" value="c" checked class="w-4 h-4 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-950 border-slate-400 dark:border-slate-700 focus:ring-emerald-500">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Créer une archive (-c)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-action" value="x" class="w-4 h-4 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-950 border-slate-400 dark:border-slate-700 focus:ring-emerald-500">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Extraire (-x)</span>
                                </label>
                            </div>
                        </div>

                        <!-- Choix de la compression -->
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">2. Compression</label>
                            <div class="flex flex-wrap gap-4">
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-comp" value="z" checked class="w-4 h-4 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-950 border-slate-400 dark:border-slate-700 focus:ring-emerald-500">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Gzip (-z)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-comp" value="j" class="w-4 h-4 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-950 border-slate-400 dark:border-slate-700 focus:ring-emerald-500">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Bzip2 (-j)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-comp" value="" class="w-4 h-4 text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-950 border-slate-400 dark:border-slate-700 focus:ring-emerald-500">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Aucune</span>
                                </label>
                            </div>
                        </div>

                        <!-- Options -->
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">3. Options</label>
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" name="tar-verbose" value="v" checked class="w-4 h-4 rounded text-emerald-600 dark:text-emerald-500 bg-white dark:bg-slate-950 border-slate-400 dark:border-slate-700 focus:ring-emerald-500">
                                <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Mode verbeux / voir les fichiers traités (-v)</span>
                            </label>
                        </div>
                    </div>

                    <!-- Zone de Résultat -->
                    <div class="bg-slate-100 dark:bg-slate-950 rounded-xl p-6 border border-slate-300 dark:border-slate-800 flex flex-col relative h-full">
                        <h3 class="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Résultat</h3>
                        
                        <div class="flex-grow flex items-center justify-center">
                            <div class="w-full text-center">
                                <p class="text-slate-500 dark:text-slate-500 text-sm mb-2 font-mono">Terminal</p>
                                <div class="bg-slate-800 dark:bg-black/50 p-4 rounded-lg font-mono text-lg text-emerald-400 dark:text-emerald-400 border border-slate-700 dark:border-slate-800 shadow-inner break-all" id="tar-result">
                                    tar -czvf mon_archive.tar.gz dossier/
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        appContainer.innerHTML = html;
        
        // Écouteurs d'événements pour mettre à jour la commande en temps réel
        const inputs = appContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', updateTarCommand);
        });
        
        // Fonction de mise à jour (logique métier de TAR)
        function updateTarCommand() {
            const action = document.querySelector('input[name="tar-action"]:checked').value;
            const comp = document.querySelector('input[name="tar-comp"]:checked').value;
            const verbose = document.querySelector('input[name="tar-verbose"]').checked ? 'v' : '';
            
            // Déduction de l'extension
            const ext = comp === 'z' ? '.tar.gz' : (comp === 'j' ? '.tar.bz2' : '.tar');
            
            // Déduction du nom générique de la cible selon l'action
            const archiveName = action === 'c' ? `mon_archive${ext}` : `fichier${ext}`;
            const target = action === 'c' ? 'dossier_cible/' : '';

            // Construction de la chaîne des arguments (flags)
            const flags = `-${action}${comp}${verbose}f`;
            
            // Assemblage final
            const cmd = `tar ${flags} ${archiveName} ${target}`.trim();
            
            // Affichage
            document.getElementById('tar-result').innerText = cmd;
        }
    }

    // --- MODULE 4 : TUTOS & PROCÉDURES (WIZARD) ---
    function renderProcedures() {
        let currentProc = null;
        let currentStepIndex = 0;

        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;

        appContainer.innerHTML = `
            ${backBtn}
            <div class="flex flex-col lg:flex-row gap-8 lg:h-[850px]">
                <div class="w-full lg:w-1/3 flex flex-col gap-3" id="proc-sidebar"></div>
                <div class="w-full lg:w-2/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 lg:p-8 flex flex-col relative shadow-sm dark:shadow-lg dark:shadow-black/20 overflow-y-auto" id="proc-content"></div>
            </div>
        `;

        function updateProcSidebar() {
            const sidebar = document.getElementById('proc-sidebar');
            
            // Groupement par catégorie
            const grouped = procedures.reduce((acc, proc) => {
                if (!acc[proc.category]) acc[proc.category] = [];
                acc[proc.category].push(proc);
                return acc;
            }, {});

            let html = '<div class="flex-grow bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 overflow-y-auto shadow-sm dark:shadow-none">';
            for (const [category, procs] of Object.entries(grouped)) {
                html += `<div class="mb-5 last:mb-0">
                            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-2 border-l-2 border-pink-500/30">${category}</h3>
                            <ul class="space-y-1">`;
                procs.forEach(proc => {
                    const isActive = currentProc && currentProc.id === proc.id;
                    html += `<li>
                                <button class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${isActive ? 'bg-pink-50 text-pink-800 dark:bg-pink-500/10 dark:text-pink-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}" data-id="${proc.id}">
                                    <span>${proc.title}</span>
                                    <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${proc.difficulty === 'Facile' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/30 text-amber-600 dark:text-amber-400'}">${proc.difficulty}</span>
                                </button>
                             </li>`;
                });
                html += `   </ul></div>`;
            }
            html += '</div>';
            sidebar.innerHTML = html;

            sidebar.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentProc = procedures.find(p => p.id === e.currentTarget.getAttribute('data-id'));
                    currentStepIndex = 0;
                    updateProcSidebar();
                    updateProcWizard();
                });
            });
        }

        function updateProcWizard() {
            const contentArea = document.getElementById('proc-content');
            if (!currentProc) {
                contentArea.innerHTML = `<div class="flex h-full items-center justify-center text-slate-500 flex-col gap-4 text-center">
                    <svg class="w-16 h-16 text-slate-300 dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    <p>Sélectionnez un tutoriel pour démarrer l'assistant.</p>
                </div>`;
                return;
            }

            const step = currentProc.steps[currentStepIndex];
            const progress = ((currentStepIndex + 1) / currentProc.steps.length) * 100;

            contentArea.innerHTML = `
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">${currentProc.title}</h2>
                    <p class="text-slate-600 dark:text-slate-400">${currentProc.description}</p>
                </div>

                <!-- Progress Bar -->
                <div class="mb-8">
                    <div class="flex justify-between text-xs font-bold text-slate-500 mb-2 tracking-wider uppercase">
                        <span>Étape ${currentStepIndex + 1} sur ${currentProc.steps.length}</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-pink-500 transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                </div>

                <!-- Step Content -->
                <div class="flex-grow">
                    <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">${step.title}</h3>
                    <p class="text-slate-700 dark:text-slate-300 text-lg mb-6 leading-relaxed whitespace-pre-wrap">${step.text}</p>
                    
                    ${step.command ? `
                    <div class="bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-800 rounded-lg p-4 group relative flex justify-between items-start gap-4">
                        <code class="text-emerald-600 dark:text-emerald-400 font-mono text-sm break-words whitespace-pre-wrap flex-grow">${step.command}</code>
                        <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${step.command.replace(/"/g, '&quot;').replace(/\n/g, '&#10;')}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- Controls -->
                <div class="mt-8 flex justify-between pt-6 border-t border-slate-300 dark:border-slate-800">
                    <button id="btn-prev-step" class="px-4 py-2 rounded-lg font-bold transition-colors ${currentStepIndex === 0 ? 'opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}">
                        &larr; Précédent
                    </button>
                    ${currentStepIndex === currentProc.steps.length - 1 ? `
                    <button id="btn-finish-step" class="px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-pink-500/20">
                        Terminer la procédure !
                    </button>
                    ` : `
                    <button id="btn-next-step" class="px-6 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg font-bold transition-colors shadow-lg shadow-black/10">
                        Étape suivante &rarr;
                    </button>
                    `}
                </div>
            `;

            if (currentStepIndex > 0) {
                document.getElementById('btn-prev-step').addEventListener('click', () => { currentStepIndex--; updateProcWizard(); });
            }
            if (currentStepIndex < currentProc.steps.length - 1) {
                document.getElementById('btn-next-step').addEventListener('click', () => { currentStepIndex++; updateProcWizard(); });
            } else {
                document.getElementById('btn-finish-step').addEventListener('click', () => { currentProc = null; updateProcSidebar(); updateProcWizard(); });
            }
        }

        updateProcSidebar();
        updateProcWizard();
    }

    // --- MODULE : FAVORIS ---
    function renderFavorites() {
        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;
        
        let contentHtml = '';
        if (favoriteItems.length === 0) {
            contentHtml = `
                <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-8 text-center shadow-sm dark:shadow-lg dark:shadow-black/20">
                    <div class="inline-block p-4 bg-slate-100 dark:bg-slate-950 rounded-full border border-slate-300 dark:border-slate-800 mb-4 text-amber-500 dark:text-amber-400">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                    </div>
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Vos éléments favoris</h2>
                    <p class="text-slate-600 dark:text-slate-400 mb-6">Vous n'avez pas encore de favoris. Parcourez le catalogue et cliquez sur l'étoile à côté d'une commande pour la sauvegarder ici !</p>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="mb-6 border-b border-slate-300 dark:border-slate-800 pb-6">
                    <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Vos commandes favorites</h2>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${favoriteItems.filter(f => f.type === 'command').map(cmd => {
                        const payload = encodeURIComponent(JSON.stringify({ name: cmd.name, desc: cmd.desc, example: cmd.example, category: cmd.category }));
                        return `
                        <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl p-6 transition-colors flex flex-col h-full shadow-sm dark:shadow-lg dark:shadow-black/20 group">
                            <div class="flex justify-between items-start mb-4">
                                <h2 class="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200">${cmd.name}</h2>
                                <span class="bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs px-3 py-1 rounded-full border shadow-sm">${cmd.category}</span>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed">${cmd.desc}</p>
                            <div class="bg-slate-100 dark:bg-black/40 rounded-lg p-3 font-mono text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800/50 flex justify-between items-center gap-4">
                                <div class="overflow-x-auto whitespace-nowrap hide-scrollbar flex-grow">
                                    <span class="text-emerald-500 dark:text-emerald-500/50 mr-2">$</span>${cmd.example}
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${cmd.example.replace(/"/g, '&quot;')}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    </button>
                                    <button onclick="toggleFavorite('${cmd.name}', 'command', '${payload}', this)" class="text-amber-500 dark:text-amber-400 hover:text-slate-500 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Retirer des favoris">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        appContainer.innerHTML = backBtn + contentHtml;
    }

    // --- MODULE 5 : LIENS & PROJETS ---
    function renderLinks() {
        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;

        appContainer.innerHTML = `
            ${backBtn}
            <div class="mb-8 border-b border-slate-300 dark:border-slate-800 pb-6">
                <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Projets & Ressources</h2>
                <p class="text-slate-600 dark:text-slate-400 mt-2">Votre écosystème d'outils d'administration et vos liens d'apprentissage favoris.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Projets Locaux -->
                <div>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        Mes autres outils
                    </h3>
                    <div class="space-y-4">
                        <a href="https://outil-ad.netlify.app/" target="_blank" class="block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none group">
                            <h4 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">~/Outil_AD</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Générateur de commandes Powershell pour Active Directory et catalogue de GPOs.</p>
                        </a>
                        <a href="https://outils-reseaux.netlify.app/" target="_blank" class="block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none group">
                            <h4 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">~/Outils_Réseaux</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Plateforme d'apprentissage et d'entrainement des bases du réseau informatique, avec outils, calculateur de sous-réseaux et Quiz !</p>
                        </a>
                        <a href="https://github.com/valentinprades" target="_blank" class="block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none group">
                            <h4 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-2">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
                                Déploiement Scripts Auto
                            </h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Mon dépôt GitHub avec tous mes scripts automatisés Debian, pour déployer des services complets tels que Zabbix, Guacamole, n8n,etc...</p>
                        </a>
                    </div>
                </div>

                <!-- Ressources Apprentissage -->
                <div>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Apprentissage ludique
                    </h3>
                    <div class="space-y-4">
                        <a href="https://explainshell.com/" target="_blank" class="block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors shadow-sm dark:shadow-none group">
                            <h4 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">ExplainShell</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Collez n'importe quelle commande complexe, le site vous expliquera chaque argument visuellement.</p>
                        </a>
                        <a href="http://web.mit.edu/mprat/Public/web/Terminus/Web/main.html" target="_blank" class="block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors shadow-sm dark:shadow-none group">
                            <h4 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">Terminus (Jeu MIT)</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Un jeu d'aventure textuel créé par le MIT pour apprendre à se déplacer dans un terminal Linux.</p>
                        </a>
                        <a href="https://overthewire.org/wargames/bandit/" target="_blank" class="block bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors shadow-sm dark:shadow-none group">
                            <h4 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">OverTheWire (Bandit)</h4>
                            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Le célèbre wargame pour débutant. Connectez-vous en SSH et résolvez les énigmes avec des commandes bash.</p>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Initialisation
    Promise.all([loadCommands(), loadKnowledgeBase(), loadProcedures()]).then(() => {
        // Lecture du hash dans l'URL (ex: #catalog) pour un accès direct au rechargement
        const initialHash = window.location.hash.substring(1);
        if (initialHash) {
            window.navigate(initialHash, false);
        } else {
            history.replaceState({ view: 'home' }, '', '#home');
            renderDashboard();
        }
    });
});