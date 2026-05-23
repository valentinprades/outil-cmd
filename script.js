document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app');

    // --- AUDIO SYNTHESIZER (Sons du Quiz) ---
    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Note Do (C5)
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // Glisse vers La (A5)
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime); // Note grave
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) { console.error("Audio non supporté par le navigateur"); }
    };

    // --- GESTION DES UNIVERS (BASH / POWERSHELL) ---
    let currentUniverse = 'bash';
    let bashData = { cmds: [], kb: [], proc: [], quiz: [] };
    let psData = { cmds: [], kb: [], proc: [], quiz: [] };

    let allCommands = [];
    let knowledgeBase = [];
    let procedures = [];
    let bashQuiz = [];

    let bashFavorites = [];
    let psFavorites = [];
    let favoriteItems = []; // Pointeur vers les favoris actifs

    try {
        bashFavorites = JSON.parse(localStorage.getItem('bashFavorites')) || [];
        psFavorites = JSON.parse(localStorage.getItem('psFavorites')) || [];
    } catch (e) {
    }
    favoriteItems = bashFavorites;

    // --- UTILITAIRES DE SÉCURITÉ (XSS) ---
    const escapeHtml = (unsafe) => {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    const sanitizeHtml = (html) => typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : escapeHtml(html);

    // Moteur de Thème : Remplace le vert émeraude par le cyan en mode PowerShell
    const applyTheme = (htmlString) => {
        if (currentUniverse === 'powershell') {
            return htmlString.replace(/emerald-/g, 'cyan-');
        }
        return htmlString;
    };

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

    // Fonction unifiée pour charger les deux univers
    async function loadAllData() {
        const fetchJson = async (url) => {
            try { const r = await fetch(url); return r.ok ? await r.json() : []; } catch (e) { return []; }
        };

        [bashData.cmds, bashData.kb, bashData.proc, bashData.quiz] = await Promise.all([
            fetchJson('./bashCommands.json'), fetchJson('./knowledgeBase.json'), fetchJson('./procedures.json'), fetchJson('./bashQuiz.json')
        ]);

        [psData.cmds, psData.kb, psData.proc, psData.quiz] = await Promise.all([
            fetchJson('./psCommands.json'), fetchJson('./psKnowledgeBase.json'), fetchJson('./psProcedures.json'), fetchJson('./psQuiz.json')
        ]);

        allCommands = bashData.cmds;
        knowledgeBase = bashData.kb;
        procedures = bashData.proc;
        bashQuiz = bashData.quiz;
    }

    window.switchUniverse = function(universe) {
        currentUniverse = universe;
        const navLogo = document.getElementById('nav-logo');
        const btnBash = document.getElementById('nav-btn-bash');
        const btnPS = document.getElementById('nav-btn-ps');
        const favicon = document.querySelector('link[rel="icon"]');

        const svgBase = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22COLOR%22><path fill-rule=%22evenodd%22 d=%22M2.25 6A3.75 3.75 0 016 2.25h12A3.75 3.75 0 0121.75 6v12A3.75 3.75 0 0118 21.75H6A3.75 3.75 0 012.25 18V6zm5.836 2.456a.75.75 0 00-1.172 1.018l2.97 3.468-2.97 3.467a.75.75 0 101.172 1.018l3.407-3.978a.75.75 0 000-1.016L8.086 8.456zM12 16.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z%22 clip-rule=%22evenodd%22/></svg>';

        if (universe === 'bash') {
            allCommands = bashData.cmds; knowledgeBase = bashData.kb; procedures = bashData.proc; bashQuiz = bashData.quiz; favoriteItems = bashFavorites;

            document.title = '~/Outil_Bash';
            if (favicon) favicon.href = svgBase.replace('COLOR', '%2334d399'); // Vert Émeraude
            navLogo.innerText = '~/Outil_Bash';
            navLogo.className = 'text-xl font-bold text-emerald-400 font-mono hover:text-emerald-300 transition-colors';
            btnBash.className = 'bg-white dark:bg-slate-900/50 border border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition-all font-bold text-sm shadow-sm';
            btnPS.className = 'bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition-all font-bold text-sm shadow-sm';
        } else {
            allCommands = psData.cmds; knowledgeBase = psData.kb; procedures = psData.proc; bashQuiz = psData.quiz; favoriteItems = psFavorites;

            document.title = 'C:\\> Outil_PowerShell';
            if (favicon) favicon.href = svgBase.replace('COLOR', '%2322d3ee'); // Bleu Cyan
            navLogo.innerText = 'PS C:\\> Outil_PowerShell';
            navLogo.className = 'text-xl font-bold text-cyan-400 font-mono hover:text-cyan-300 transition-colors';
            btnPS.className = 'bg-white dark:bg-slate-900/50 border border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-cyan-600 dark:text-cyan-400 rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition-all font-bold text-sm shadow-sm';
            btnBash.className = 'bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition-all font-bold text-sm shadow-sm';
        }

        navigate('home', true);
    };

    // --- SYSTEME DE NAVIGATION ---
    // Fonction attachée à "window" pour pouvoir être appelée depuis les onclick HTML
    window.navigate = function(moduleId, updateHistory = true) {
        // Nettoyage global (ex: événements du quiz)
        if (window.quizEnterHandler) {
            window.removeEventListener('keydown', window.quizEnterHandler);
        }

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
        } else if (moduleId === 'quiz') {
            renderQuiz();
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
        if (!navigator.clipboard) {
            console.error("L'API Presse-papiers nécessite un serveur web (HTTPS ou localhost).");
            return;
        }
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

        localStorage.setItem(currentUniverse === 'bash' ? 'bashFavorites' : 'psFavorites', JSON.stringify(favoriteItems));

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
                title: 'Générateur Bash',
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

        let gridHtml = `
            <!-- Bandeau de présentation (Hero section) -->
            <div class="mb-12 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-8 relative overflow-hidden shadow-sm dark:shadow-lg dark:shadow-black/20">
                <div class="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <h2 class="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4 relative z-10">Maîtrisez votre environnement Linux.</h2>
                <p class="text-slate-600 dark:text-slate-400 text-lg max-w-3xl leading-relaxed relative z-10">
                    <span class="text-emerald-600 dark:text-emerald-400 font-mono">~/Outil_Bash</span> est votre couteau suisse pour l'administration système.<br>Retrouvez la syntaxe exacte de vos commandes, révisez la théorie grâce aux fiches réflexes.
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

        if (currentUniverse === 'powershell') {
            gridHtml = gridHtml.replace("Maîtrisez votre environnement Linux.", "Maîtrisez votre environnement Windows.")
                               .replace("~/Outil_Bash", "PS C:\\> Outil_PowerShell")
                               .replace("Générateur Bash", "Générateur PowerShell")
                               .replace("commandes Linux", "commandes Windows")
                               .replace("Terminal Quiz", "PowerShell Quiz")
                               .replace("administration système Linux", "administration système Windows");
        }

        appContainer.innerHTML = applyTheme(gridHtml);
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

        appContainer.innerHTML = applyTheme(gridHtml);

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
                "Processus & Système": "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50",
                "Découverte & Aide": "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800/50",
                "Données & Fichiers": "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
            };

            grid.innerHTML = filtered.map(cmd => {
                const safeName = escapeHtml(cmd.name);
                const safeCategory = escapeHtml(cmd.category);
                const safeDesc = sanitizeHtml(cmd.description);
                const safeExample = escapeHtml(cmd.example);

                const badgeTheme = badgeColors[cmd.category] || "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

                const isFav = favoriteItems.some(f => f.id === cmd.name && f.type === 'command');
                const starIcon = isFav ? `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>` : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`;
                const starColorClass = isFav ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500';
                const payload = encodeURIComponent(JSON.stringify({ name: cmd.name, desc: cmd.description, example: cmd.example, category: cmd.category })).replace(/'/g, "%27");

                return `
                    <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl p-6 transition-colors flex flex-col h-full shadow-sm dark:shadow-lg dark:shadow-black/20 group min-w-0">
                        <div class="flex justify-between items-start mb-4">
                            <h2 class="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200">${safeName}</h2>
                            <span class="${badgeTheme} text-xs px-3 py-1 rounded-full border shadow-sm">${safeCategory}</span>
                        </div>
                        <p class="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">${safeDesc}</p>
                        <div class="bg-slate-100 dark:bg-black/40 rounded-lg p-3 font-mono text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800/50 flex justify-between items-center gap-4 min-w-0">
                            <div class="overflow-x-auto whitespace-nowrap hide-scrollbar flex-grow min-w-0">
                                <span class="text-emerald-500 dark:text-emerald-500/50 mr-2">$</span>${safeExample}
                            </div>
                            <div class="flex gap-2">
                                <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${escapeHtml(cmd.example)}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                                <button data-id="${escapeHtml(cmd.name)}" data-type="command" data-payload="${payload}" onclick="toggleFavorite(this.dataset.id, this.dataset.type, this.dataset.payload, this)" class="${starColorClass} hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Ajouter aux favoris">
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
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <!-- Sidebar -->
                <div class="flex flex-col gap-3 min-w-0 lg:sticky lg:top-28">
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
                    <div id="kb-sidebar-list" class="flex-grow bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 overflow-y-auto shadow-sm dark:shadow-none lg:max-h-[calc(100vh-16rem)]">
                        <!-- Dynamiquement rempli par la recherche -->
                    </div>
                </div>

                <!-- Content Area -->
                <div class="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 lg:p-8 shadow-sm dark:shadow-lg dark:shadow-black/20 min-w-0" id="kb-content-area">
                    <div class="flex h-full items-center justify-center text-slate-500 flex-col gap-4">
                        <svg class="w-16 h-16 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        <p>Sélectionnez une fiche dans le menu pour afficher son contenu.</p>
                    </div>
                </div>
            </div>
        `;
        appContainer.innerHTML = applyTheme(appContainer.innerHTML); // Setup structure

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
                                ${escapeHtml(fiche.title)}
                                </button>
                             </li>`;
                });
                html += `   </ul>
                         </div>`;
            }
            listContainer.innerHTML = applyTheme(html);

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
        const descHtml = sanitizeHtml(fiche.description).replace(/\n/g, '<br/>');

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
                    <p class="text-sm leading-relaxed">${sanitizeHtml(fiche.alert)}</p>
                    </div>
                `;
            }

            const isFav = favoriteItems.some(f => f.id === fiche.id && f.type === 'knowledge');
            const starIcon = isFav ? `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>` : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`;
            const starColorClass = isFav ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600' : 'text-slate-500 hover:text-amber-500 dark:hover:text-amber-400';
            const payload = encodeURIComponent(JSON.stringify({ title: fiche.title, desc: fiche.description, category: fiche.category })).replace(/'/g, "%27");

            const commandsHtml = fiche.commands.map(cmd => `
                <div class="mb-6 last:mb-0">
                ${cmd.note ? `<p class="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">${sanitizeHtml(cmd.note)}</p>` : ''}
                    <div class="bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-800 rounded-lg p-4 group relative flex justify-between items-start gap-4 min-w-0">
                    <code class="text-emerald-600 dark:text-emerald-400 font-mono text-sm break-words whitespace-pre-wrap flex-grow min-w-0">${escapeHtml(cmd.code)}</code>
                        <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${escapeHtml(cmd.code)}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                    </div>
                </div>
            `).join('');

            contentArea.innerHTML = applyTheme(`
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <span class="inline-block px-3 py-1 bg-slate-200 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-xs">
                            ${fiche.category}
                        </span>
                        <button data-id="${escapeHtml(fiche.id)}" data-type="knowledge" data-payload="${payload}" onclick="toggleFavorite(this.dataset.id, this.dataset.type, this.dataset.payload, this)" class="${starColorClass} transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-sm" title="Ajouter aux favoris">
                            ${starIcon}
                        </button>
                    </div>
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
            `);
        }

        // Initialisation de la vue avec la liste complète
        updateKBSidebar();
    }

    // --- MODULE 3 : GÉNÉRATEUR BASH ---
    function renderGenerator() {
        let activeGen = currentUniverse === 'powershell' ? 'set-acl' : 'chmod'; // Outil par défaut

        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;

        appContainer.innerHTML = `
            ${backBtn}
            <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-lg dark:shadow-black/20 min-h-[600px] flex flex-col">
                <div class="flex items-center gap-4 mb-6">
                    <div class="p-3 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-300 dark:border-slate-800 text-purple-600 dark:text-purple-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Générateurs ${currentUniverse === 'powershell' ? 'PowerShell' : 'Bash'}</h2>
                        <p class="text-slate-600 dark:text-slate-400 mt-1">Assistants visuels pour construire vos commandes complexes sans erreur.</p>
                    </div>
                </div>

                <!-- Onglets (Pills) -->
                <div id="gen-tabs" class="flex flex-wrap gap-2 mb-6 border-b border-slate-300 dark:border-slate-800 pb-4"></div>

                <!-- Zone de travail dynamique -->
                <div id="gen-workspace" class="flex-grow flex flex-col"></div>
            </div>
            ${currentUniverse === 'powershell' ? `
            <div class="mt-8 p-6 bg-cyan-50 dark:bg-slate-800/50 border border-cyan-200 dark:border-cyan-800/50 rounded-xl flex flex-col sm:flex-row items-center justify-between shadow-sm">
                <div class="mb-4 sm:mb-0">
                    <h3 class="text-lg font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        Gérer l'Active Directory ?
                    </h3>
                    <p class="text-sm text-cyan-700 dark:text-cyan-400 mt-1">Les fonctions AD ont été externalisées. Découvrez notre générateur dédié à la création d'utilisateurs et groupes.</p>
                </div>
                <a href="https://outil-ad.netlify.app/" target="_blank" class="shrink-0 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                    Ouvrir Outil-AD
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
            </div>
            ` : ''}
        `;

        const tabs = currentUniverse === 'powershell' ? [
            { id: 'set-acl', icon: '🔐', label: 'Droits NTFS (Set-Acl)' },
            { id: 'get-childitem', icon: '🔍', label: 'Recherche (Get-ChildItem)' },
            { id: 'net-ip', icon: '🌐', label: 'Réseau (New-NetIPAddress)' },
            { id: 'gen-tasks', icon: '⏰', label: 'Tâches (Tasks)' },
            { id: 'gen-firewall', icon: '🛡️', label: 'Pare-feu (Firewall)' }
        ] : [
            { id: 'chmod', icon: '🔐', label: 'Droits (chmod)' },
            { id: 'find', icon: '🔍', label: 'Recherche (find)' },
            { id: 'cron', icon: '⏱️', label: 'Tâches (cron)' },
            { id: 'useradd', icon: '👤', label: 'Comptes (useradd)' },
            { id: 'adduser', icon: '🧑‍💻', label: 'Comptes (adduser)' },
            { id: 'tar', icon: '📦', label: 'Archivage (tar)' },
            { id: 'grep', icon: '📄', label: 'Texte (grep)' },
            { id: 'systemctl', icon: '⚙️', label: 'Services (systemctl)' }
        ];

        // Rend les boutons du menu
        function renderTabs() {
            const tabsContainer = document.getElementById('gen-tabs');
            tabsContainer.innerHTML = tabs.map(t => `
                <button class="px-4 py-2 rounded-lg font-medium text-sm transition-colors border shadow-sm ${activeGen === t.id ? (currentUniverse === 'powershell' ? 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50' : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/50') : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-800'}" onclick="window.switchGen('${t.id}')">
                    ${t.icon} ${t.label}
                </button>
            `).join('');
        }

        // Exposée globalement pour le clic sur les onglets
        window.switchGen = function(id) {
            activeGen = id;
            renderTabs();
            renderWorkspace();
        };

        // Rend l'interface de l'outil sélectionné
        function renderWorkspace() {
            const ws = document.getElementById('gen-workspace');

            // Template HTML du cadre de Résultat Terminal
            const resultBox = (id) => `
                <div class="mt-8 bg-slate-100 dark:bg-slate-950 rounded-xl p-6 border border-slate-300 dark:border-slate-800 flex flex-col mt-auto">
                    <h3 class="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Résultat</h3>
                    <div class="w-full text-center">
                        <div class="bg-slate-800 dark:bg-black/50 p-4 rounded-lg font-mono text-lg text-emerald-400 dark:text-emerald-400 border border-slate-700 dark:border-slate-800 shadow-inner break-all flex justify-between items-center gap-4">
                            <span id="${id}-result" class="flex-grow text-left whitespace-pre-wrap"></span>
                            <button onclick="copyCommand(document.getElementById('${id}-result').innerText, this)" class="text-slate-400 hover:text-white transition-colors p-2 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 flex-shrink-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </button>
                        </div>
                        <p id="${id}-explain" class="text-slate-500 dark:text-slate-400 text-sm mt-3"></p>
                    </div>
                </div>
            `;

            if (activeGen === 'chmod') {
                ws.innerHTML = `
                    <div class="mb-6 flex flex-col md:flex-row gap-6 items-center">
                        <div class="flex flex-col items-center p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg w-full md:w-1/3">
                            <label class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Valeur Octale</label>
                            <input type="text" id="chmod-octal" value="755" maxlength="3" class="w-24 text-center text-3xl font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 focus:outline-none focus:border-purple-500 text-purple-600 dark:text-purple-400 font-bold shadow-inner">
                        </div>
                        <div class="w-full md:w-2/3 text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800/50 flex items-start gap-3">
                            <span class="text-xl">💡</span>
                            <p><strong>Outil bidirectionnel :</strong> Modifiez les cases à cocher pour calculer la valeur numérique, ou tapez directement un chiffre (ex: 644, 777) dans la case pour voir les droits s'appliquer !</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${['Propriétaire (u)', 'Groupe (g)', 'Autres (o)'].map((role, i) => {
                            const prefix = ['u', 'g', 'o'][i];
                            return `
                            <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">${role}</h4>
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" id="chmod-${prefix}-r" class="chmod-check w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                        <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Lecture (r) - 4</span>
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" id="chmod-${prefix}-w" class="chmod-check w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                        <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Écriture (w) - 2</span>
                                    </label>
                                    <label class="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" id="chmod-${prefix}-x" class="chmod-check w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                        <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Exécution (x) - 1</span>
                                    </label>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="mt-6 flex flex-col md:flex-row gap-4 md:items-center">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="chmod-recursive" class="chmod-opt w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                            <span class="font-bold text-slate-700 dark:text-slate-300">Récursif (-R)</span>
                        </label>
                        <input type="text" id="chmod-target" value="dossier/" placeholder="Cible (ex: fichier.txt)" class="chmod-opt bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 flex-grow focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                    </div>
                    ${resultBox('chmod')}
                `;

                const octalInput = document.getElementById('chmod-octal');

                const updateResult = (octalVal) => {
                    const target = document.getElementById('chmod-target').value || 'fichier';
                    const isR = document.getElementById('chmod-recursive').checked ? '-R ' : '';
                    const getSym = (p) => (document.getElementById(`chmod-${p}-r`).checked ? 'r' : '-') + (document.getElementById(`chmod-${p}-w`).checked ? 'w' : '-') + (document.getElementById(`chmod-${p}-x`).checked ? 'x' : '-');

                    const safeOctal = octalVal.length === 3 ? octalVal : '000';
                    document.getElementById('chmod-result').innerText = `chmod ${isR}${safeOctal} ${target}`;
                    document.getElementById('chmod-explain').innerText = `Équivalent symbolique : chmod ${isR}u=${getSym('u')},g=${getSym('g')},o=${getSym('o')} ${target}`;
                };

                const updateFromCheckboxes = () => {
                    const getVal = (p) => (document.getElementById(`chmod-${p}-r`).checked ? 4 : 0) + (document.getElementById(`chmod-${p}-w`).checked ? 2 : 0) + (document.getElementById(`chmod-${p}-x`).checked ? 1 : 0);
                    const octalVal = `${getVal('u')}${getVal('g')}${getVal('o')}`;
                    if (document.activeElement !== octalInput) octalInput.value = octalVal;
                    updateResult(octalVal);
                };

                const updateFromOctal = () => {
                    let val = octalInput.value.replace(/[^0-7]/g, '');
                    if (val.length > 3) val = val.substring(0, 3);
                    octalInput.value = val;

                    if (val.length === 3) {
                        const setChecks = (p, num) => {
                            document.getElementById(`chmod-${p}-r`).checked = (num & 4) === 4;
                            document.getElementById(`chmod-${p}-w`).checked = (num & 2) === 2;
                            document.getElementById(`chmod-${p}-x`).checked = (num & 1) === 1;
                        };
                        setChecks('u', parseInt(val[0]));
                        setChecks('g', parseInt(val[1]));
                        setChecks('o', parseInt(val[2]));
                        updateResult(val);
                    }
                };

                ws.querySelectorAll('.chmod-check').forEach(el => el.addEventListener('change', updateFromCheckboxes));
                ws.querySelectorAll('.chmod-opt').forEach(el => el.addEventListener('input', () => updateResult(octalInput.value.length === 3 ? octalInput.value : '000')));
                octalInput.addEventListener('input', updateFromOctal);

                // Initialisation via la valeur "755" codée en dur dans l'input
                updateFromOctal();

            } else if (activeGen === 'find') {
                ws.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">1. Où chercher ?</label>
                                <input type="text" id="find-path" value="/var/log/" class="find-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">2. Nom du fichier (-name)</label>
                                <input type="text" id="find-name" value="*.log" placeholder="Ex: *.txt" class="find-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">3. Type (-type)</label>
                                <select id="find-type" class="find-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                    <option value="">Peu importe (Tout afficher)</option>
                                    <option value="f" selected>Fichier uniquement (f)</option>
                                    <option value="d">Dossier uniquement (d)</option>
                                </select>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">4. Âge (-mtime)</label>
                                <div class="flex gap-2">
                                    <select id="find-mtime-op" class="find-input bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                        <option value="">Ignorer</option>
                                        <option value="+" selected>+ (Plus de)</option>
                                        <option value="-">- (Moins de)</option>
                                        <option value="">= (Exactement)</option>
                                    </select>
                                    <input type="number" id="find-mtime-val" value="30" min="0" class="find-input w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                    <span class="py-2 text-slate-600 dark:text-slate-400">jours</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">5. Action (-exec)</label>
                                <select id="find-exec" class="find-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                    <option value="">Aucune (Afficher le chemin)</option>
                                    <option value="rm -f {} \\;">Supprimer (rm)</option>
                                    <option value="chmod 644 {} \\;">Changer les droits (chmod)</option>
                                    <option value="cp {} /backup/ \\;">Copier vers /backup/ (cp)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    ${resultBox('find')}
                `;

                const updateFind = () => {
                    let cmd = `find ${document.getElementById('find-path').value || '.'}`;
                    const name = document.getElementById('find-name').value;
                    if (name) cmd += ` -name "${name}"`;
                    const type = document.getElementById('find-type').value;
                    if (type) cmd += ` -type ${type}`;

                    const mtimeOp = document.getElementById('find-mtime-op').value;
                    const mtimeVal = document.getElementById('find-mtime-val').value;
                    if (document.getElementById('find-mtime-op').selectedIndex > 0 && mtimeVal) {
                        cmd += ` -mtime ${mtimeOp}${mtimeVal}`;
                    }

                    const exec = document.getElementById('find-exec').value;
                    if (exec) cmd += ` -exec ${exec}`;

                    document.getElementById('find-result').innerText = cmd;
                    document.getElementById('find-explain').innerText = "Conseil de Pro : Avant de sélectionner l'action 'Supprimer', lancez la commande SANS le -exec pour vérifier visuellement que vous ne supprimez pas de mauvais fichiers !";
                };

                ws.querySelectorAll('.find-input').forEach(el => el.addEventListener('input', updateFind));
                updateFind();

            } else if (activeGen === 'cron') {
                ws.innerHTML = `
                    <div class="mb-4">
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Configurations rapides (Presets)</label>
                        <select id="cron-preset" class="w-full md:w-1/2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            <option value="0 2 * * *">Tous les jours à 02:00 du matin (Backup)</option>
                            <option value="*/15 * * * *">Toutes les 15 minutes</option>
                            <option value="0 0 * * 0">Tous les dimanches à minuit</option>
                            <option value="0 * * * *">Toutes les heures (à la minute 0)</option>
                            <option value="custom" selected>Personnalisé (Remplir ci-dessous)</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div><label class="text-xs font-bold text-slate-500">Minute (0-59)</label><input type="text" id="c-min" value="0" class="cron-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-2 focus:outline-none focus:border-purple-500 text-center font-mono text-slate-800 dark:text-slate-200"></div>
                        <div><label class="text-xs font-bold text-slate-500">Heure (0-23)</label><input type="text" id="c-hour" value="2" class="cron-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-2 focus:outline-none focus:border-purple-500 text-center font-mono text-slate-800 dark:text-slate-200"></div>
                        <div><label class="text-xs font-bold text-slate-500">Jour du Mois</label><input type="text" id="c-dom" value="*" class="cron-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-2 focus:outline-none focus:border-purple-500 text-center font-mono text-slate-800 dark:text-slate-200"></div>
                        <div><label class="text-xs font-bold text-slate-500">Mois (1-12)</label><input type="text" id="c-mon" value="*" class="cron-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-2 focus:outline-none focus:border-purple-500 text-center font-mono text-slate-800 dark:text-slate-200"></div>
                        <div><label class="text-xs font-bold text-slate-500">Jour Sem. (0=Dim)</label><input type="text" id="c-dow" value="*" class="cron-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-2 focus:outline-none focus:border-purple-500 text-center font-mono text-slate-800 dark:text-slate-200"></div>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Commande ou Script à exécuter</label>
                        <input type="text" id="cron-cmd" value="/backup/script.sh" class="cron-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 font-mono text-slate-800 dark:text-slate-200">
                    </div>
                    ${resultBox('cron')}
                `;

                const updateCron = () => {
                    const min = document.getElementById('c-min').value || '*';
                    const hour = document.getElementById('c-hour').value || '*';
                    const dom = document.getElementById('c-dom').value || '*';
                    const mon = document.getElementById('c-mon').value || '*';
                    const dow = document.getElementById('c-dow').value || '*';
                    const cmd = document.getElementById('cron-cmd').value || 'commande';

                    document.getElementById('cron-result').innerText = `${min} ${hour} ${dom} ${mon} ${dow} ${cmd}`;
                    document.getElementById('cron-explain').innerText = `Ouvrez la table de planification avec 'crontab -e' (ou 'sudo crontab -e' si le script requiert les droits admin). Renseignez TOUJOURS les chemins absolus (ex: /usr/bin/php au lieu de php).`;
                };

                document.getElementById('cron-preset').addEventListener('change', (e) => {
                    if(e.target.value !== 'custom') {
                        const parts = e.target.value.split(' ');
                        document.getElementById('c-min').value = parts[0];
                        document.getElementById('c-hour').value = parts[1];
                        document.getElementById('c-dom').value = parts[2];
                        document.getElementById('c-mon').value = parts[3];
                        document.getElementById('c-dow').value = parts[4];
                        updateCron();
                    }
                });

                ws.querySelectorAll('.cron-input').forEach(el => el.addEventListener('input', () => {
                    document.getElementById('cron-preset').value = 'custom';
                    updateCron();
                }));
                updateCron();

            } else if (activeGen === 'useradd') {
                ws.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom d'utilisateur (Login)</label>
                                <input type="text" id="ua-name" value="jean" class="ua-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom complet / Commentaire (-c)</label>
                                <input type="text" id="ua-comment" value="Jean Dupont" class="ua-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer group mt-6 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <input type="checkbox" id="ua-home" checked class="ua-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                <span class="font-bold text-slate-700 dark:text-slate-300">Générer le dossier /home/ (-m)</span>
                            </label>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Shell par défaut (-s)</label>
                                <select id="ua-shell" class="ua-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                    <option value="/bin/bash" selected>/bin/bash (Bash - Standard)</option>
                                    <option value="/bin/sh">/bin/sh (Shell minimaliste)</option>
                                    <option value="/usr/sbin/nologin">/usr/sbin/nologin (Empêcher la connexion via SSH)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Groupes secondaires (-G)</label>
                                <input type="text" id="ua-groups" value="sudo,docker" placeholder="Ex: sudo,docker" class="ua-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                <p class="text-xs text-slate-500 mt-1">Séparés par des virgules, sans espace.</p>
                            </div>
                        </div>
                    </div>
                    ${resultBox('ua')}
                `;

                const updateUa = () => {
                    const name = document.getElementById('ua-name').value || 'nom_user';
                    const comment = document.getElementById('ua-comment').value;
                    const home = document.getElementById('ua-home').checked ? '-m' : '';
                    const shell = document.getElementById('ua-shell').value;
                    const groups = document.getElementById('ua-groups').value.replace(/\s+/g, '');

                    let cmd = `sudo useradd`;
                    if (home) cmd += ` ${home}`;
                    if (shell) cmd += ` -s ${shell}`;
                    if (groups) cmd += ` -G ${groups}`;
                    if (comment) cmd += ` -c "${comment}"`;
                    cmd += ` ${name}`;

                    document.getElementById('ua-result').innerText = cmd;
                    document.getElementById('ua-explain').innerText = `Rappel : Contrairement à 'adduser', 'useradd' ne vous demande pas le mot de passe. Vous devrez l'attribuer manuellement ensuite en tapant : sudo passwd ${name}`;
                };

                ws.querySelectorAll('.ua-input').forEach(el => el.addEventListener('input', updateUa));
                updateUa();

            } else if (activeGen === 'adduser') {
                ws.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom d'utilisateur (Login)</label>
                                <input type="text" id="add-name" value="jean" class="add-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <label class="flex items-center gap-2 cursor-pointer group mt-6 pt-2 border-t border-slate-200 dark:border-slate-800">
                                <input type="checkbox" id="add-system" class="add-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                <span class="font-bold text-slate-700 dark:text-slate-300">Utilisateur système (--system)</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer group mt-2">
                                <input type="checkbox" id="add-nohome" class="add-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                <span class="font-bold text-slate-700 dark:text-slate-300">Ne pas créer de dossier /home (--no-create-home)</span>
                            </label>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Shell par défaut (--shell)</label>
                                <select id="add-shell" class="add-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                    <option value="" selected>Par défaut (Défini par le système)</option>
                                    <option value="/bin/bash">/bin/bash (Bash - Standard)</option>
                                    <option value="/bin/sh">/bin/sh (Shell minimaliste)</option>
                                    <option value="/usr/sbin/nologin">/usr/sbin/nologin (Empêcher la connexion via SSH)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Groupe principal cible (--ingroup)</label>
                                <input type="text" id="add-ingroup" value="" placeholder="Ex: sudo" class="add-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                <p class="text-xs text-slate-500 mt-1">Laisser vide pour créer un groupe au nom de l'utilisateur.</p>
                            </div>
                        </div>
                    </div>
                    ${resultBox('add')}
                `;

                const updateAdduser = () => {
                    const name = document.getElementById('add-name').value || 'nom_user';
                    let cmd = `sudo adduser${document.getElementById('add-system').checked ? ' --system' : ''}${document.getElementById('add-nohome').checked ? ' --no-create-home' : ''}`;
                    if (document.getElementById('add-shell').value) cmd += ` --shell ${document.getElementById('add-shell').value}`;
                    if (document.getElementById('add-ingroup').value.trim()) cmd += ` --ingroup ${document.getElementById('add-ingroup').value.trim()}`;

                    document.getElementById('add-result').innerText = `${cmd} ${name}`;
                    document.getElementById('add-explain').innerText = `Rappel : 'adduser' est un script interactif (recommandé sous Debian/Ubuntu). Il vous posera quelques questions supplémentaires directement dans le terminal (Mot de passe, Nom complet, etc.).`;
                };

                ws.querySelectorAll('.add-input').forEach(el => el.addEventListener('input', updateAdduser));
                updateAdduser();

            } else if (activeGen === 'tar') {
                ws.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">1. Action</h4>
                            <div class="space-y-2">
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-action" value="c" checked class="tar-input w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Créer (-c)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-action" value="x" class="tar-input w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Extraire (-x)</span>
                                </label>
                            </div>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">2. Compression</h4>
                            <div class="space-y-2">
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-comp" value="z" checked class="tar-input w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Gzip (-z)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-comp" value="j" class="tar-input w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Bzip2 (-j)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="tar-comp" value="" class="tar-input w-4 h-4 text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Aucune</span>
                                </label>
                            </div>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">3. Options</h4>
                            <div class="space-y-2">
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" name="tar-verbose" value="v" checked class="tar-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Mode verbeux (-v)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    ${resultBox('tar')}
                `;

                const updateTarCommand = () => {
                    const action = document.querySelector('input[name="tar-action"]:checked').value;
                    const comp = document.querySelector('input[name="tar-comp"]:checked').value;
                    const verbose = document.querySelector('input[name="tar-verbose"]').checked ? 'v' : '';

                    const ext = comp === 'z' ? '.tar.gz' : (comp === 'j' ? '.tar.bz2' : '.tar');
                    const archiveName = action === 'c' ? `mon_archive${ext}` : `fichier${ext}`;
                    const target = action === 'c' ? 'dossier_cible/' : '';

                    const flags = `-${action}${comp}${verbose}f`;
                    const cmd = `tar ${flags} ${archiveName} ${target}`.trim();

                    document.getElementById('tar-result').innerText = cmd;
                    document.getElementById('tar-explain').innerText = action === 'c' ? "L'ordre '-f' doit TOUJOURS être le dernier argument, juste avant le nom de l'archive." : "Pour extraire l'archive dans un autre dossier que le dossier courant, ajoutez '-C /votre/chemin' à la fin de la commande.";
                };

                ws.querySelectorAll('.tar-input').forEach(el => el.addEventListener('change', updateTarCommand));
                updateTarCommand();

            } else if (activeGen === 'grep') {
                ws.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Que cherchez-vous ? (Motif / Regex)</label>
                                <input type="text" id="grep-pattern" value="erreur" placeholder="Ex: failed, ^Error..." class="grep-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Où chercher ? (Fichier ou Dossier)</label>
                                <input type="text" id="grep-target" value="/var/log/syslog" placeholder="Ex: /var/log/ ou fichier.txt" class="grep-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                            </div>
                        </div>
                        <div class="space-y-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                            <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">Options</h4>
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" id="grep-i" checked class="grep-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Ignorer la casse (Maj/Min) (-i)</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" id="grep-r" class="grep-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Recherche récursive dans les dossiers (-r)</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" id="grep-v" class="grep-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Inverser (Afficher ce qui NE correspond PAS) (-v)</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" id="grep-n" class="grep-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Afficher le numéro de ligne (-n)</span>
                            </label>
                        </div>
                    </div>
                    ${resultBox('grep')}
                `;

                const updateGrep = () => {
                    const pattern = document.getElementById('grep-pattern').value || 'motif';
                    const target = document.getElementById('grep-target').value || 'fichier';

                    let flags = '';
                    if (document.getElementById('grep-i').checked) flags += 'i';
                    if (document.getElementById('grep-r').checked) flags += 'r';
                    if (document.getElementById('grep-v').checked) flags += 'v';
                    if (document.getElementById('grep-n').checked) flags += 'n';

                    let cmd = 'grep';
                    if (flags) cmd += ` -${flags}`;
                    cmd += ` "${pattern}" ${target}`;

                    document.getElementById('grep-result').innerText = cmd;
                    document.getElementById('grep-explain').innerText = `grep est extrêmement puissant combiné avec le "pipe" (|). Par exemple, pour l'appliquer à un retour de commande : cat fichier.txt | grep -i "erreur"`;
                };

                ws.querySelectorAll('.grep-input').forEach(el => el.addEventListener('input', updateGrep));
                updateGrep();

            } else if (activeGen === 'systemctl') {
                ws.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Action</label>
                                <select id="sys-action" class="sys-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                    <option value="status" selected>Voir l'état (status)</option>
                                    <option value="start">Démarrer (start)</option>
                                    <option value="stop">Arrêter (stop)</option>
                                    <option value="restart">Redémarrer (restart)</option>
                                    <option value="reload">Recharger la config (reload)</option>
                                    <option value="enable">Activer au démarrage (enable)</option>
                                    <option value="disable">Désactiver au démarrage (disable)</option>
                                    <option value="daemon-reload">Recharger Systemd (daemon-reload)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du service</label>
                                <input type="text" id="sys-service" value="apache2" placeholder="Ex: sshd, nginx, mysql..." class="sys-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200">
                                <p class="text-xs text-slate-500 mt-1" id="sys-service-hint">Le .service à la fin est facultatif.</p>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">Privilèges & Options</h4>
                                <label class="flex items-center gap-2 cursor-pointer group mb-2">
                                    <input type="checkbox" id="sys-sudo" checked class="sys-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Exécuter en tant qu'admin (sudo)</span>
                                </label>
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" id="sys-user" class="sys-input w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600">
                                    <span class="text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">Service local à l'utilisateur (--user)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    ${resultBox('sys')}
                `;

                const updateSystemctl = () => {
                    const action = document.getElementById('sys-action').value;
                    const serviceInput = document.getElementById('sys-service');
                    const service = serviceInput.value || 'nom_du_service';
                    const isSudo = document.getElementById('sys-sudo').checked ? 'sudo ' : '';
                    const isUser = document.getElementById('sys-user').checked ? '--user ' : '';

                    // daemon-reload n'a pas besoin de nom de service
                    if (action === 'daemon-reload') {
                        serviceInput.disabled = true;
                        serviceInput.parentElement.classList.add('opacity-50');
                        document.getElementById('sys-result').innerText = `${isSudo}systemctl ${isUser}daemon-reload`;
                        document.getElementById('sys-explain').innerText = "Commande obligatoire après avoir modifié ou créé un fichier '.service' personnalisé dans /etc/systemd/system/.";
                    } else {
                        serviceInput.disabled = false;
                        serviceInput.parentElement.classList.remove('opacity-50');
                        document.getElementById('sys-result').innerText = `${isSudo}systemctl ${isUser}${action} ${service}`;

                        let explanation = "";
                        switch(action) {
                            case 'status': explanation = "Affiche l'état actuel, les erreurs récentes (logs) et l'uptime du service."; break;
                            case 'enable': explanation = "Crée un lien symbolique pour que le service démarre automatiquement au prochain démarrage de la machine."; break;
                            case 'reload': explanation = "Recharge la configuration à chaud sans couper le service (très utile pour Nginx/Apache)."; break;
                            default: explanation = `Effectue l'action '${action}' sur le service spécifié.`;
                        }
                        document.getElementById('sys-explain').innerText = explanation;
                    }
                };

                ws.querySelectorAll('.sys-input').forEach(el => el.addEventListener('input', updateSystemctl));
                updateSystemctl();
            } else if (activeGen === 'set-acl') {
                ws.innerHTML = applyTheme(`
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Dossier cible</label>
                                <input type="text" id="acl-path" value="C:\\Donnees\\RH" class="acl-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Utilisateur ou Groupe cible</label>
                                <input type="text" id="acl-user" value="DOMAINE\\Compta" placeholder="Ex: CORP\\Jean, DOMAINE\\RH..." class="acl-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Droits</label>
                                    <select id="acl-rights" class="acl-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                        <option value="Modify" selected>Modification (Modify)</option>
                                        <option value="FullControl">Contrôle Total (FullControl)</option>
                                        <option value="ReadAndExecute">Lecture / Exécution</option>
                                        <option value="Write">Écriture seule (Write)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Type d'accès</label>
                                    <select id="acl-type" class="acl-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                        <option value="Allow" selected>Autoriser (Allow)</option>
                                        <option value="Deny">Refuser (Deny)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-all">
                                <label class="flex items-center gap-2 cursor-pointer group mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <input type="checkbox" id="acl-adv-toggle" class="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600">
                                    <span class="font-bold text-slate-700 dark:text-slate-300">Afficher les options d'héritage avancées</span>
                                </label>
                                <div id="acl-adv-section" class="space-y-4 hidden mt-4">
                                    <div>
                                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Héritage (InheritanceFlags)</label>
                                        <select id="acl-inherit" class="acl-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                            <option value="ContainerInherit, ObjectInherit" selected>Dossiers et fichiers enfants</option>
                                            <option value="ContainerInherit">Dossiers enfants uniquement</option>
                                            <option value="ObjectInherit">Fichiers enfants uniquement</option>
                                            <option value="None">Cet objet uniquement (Aucun héritage)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Propagation (PropagationFlags)</label>
                                        <select id="acl-prop" class="acl-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                            <option value="None" selected>Appliquer à cet objet et aux enfants (None)</option>
                                            <option value="InheritOnly">Appliquer UNIQUEMENT aux enfants</option>
                                            <option value="NoPropagateInherit">Ne pas propager plus loin</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${resultBox('acl')}
                `);

                const updateAcl = () => {
                    const path = document.getElementById('acl-path').value || 'C:\\Dossier';
                    const user = document.getElementById('acl-user').value || 'DOMAINE\\Utilisateur';
                    const rights = document.getElementById('acl-rights').value;
                    const type = document.getElementById('acl-type').value;
                    const showAdv = document.getElementById('acl-adv-toggle').checked;

                    let inherit = "ContainerInherit, ObjectInherit";
                    let prop = "None";
                    if (showAdv) {
                        inherit = document.getElementById('acl-inherit').value;
                        prop = document.getElementById('acl-prop').value;
                    }

                    let cmd = `$acl = Get-Acl -Path "${path}"\n`;
                    cmd += `$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("${user}", "${rights}", "${inherit}", "${prop}", "${type}")\n`;
                    cmd += `$acl.SetAccessRule($rule)\n`;
                    cmd += `Set-Acl -Path "${path}" -AclObject $acl`;

                    document.getElementById('acl-result').innerText = cmd;
                    document.getElementById('acl-explain').innerText = "Les droits NTFS en PowerShell requièrent de récupérer l'ACL existante, de créer un objet contenant la nouvelle règle d'accès, de l'injecter dans la liste, puis d'appliquer le tout au dossier cible.";
                };

                document.getElementById('acl-adv-toggle').addEventListener('change', (e) => {
                    document.getElementById('acl-adv-section').classList.toggle('hidden', !e.target.checked);
                    updateAcl();
                });
                ws.querySelectorAll('.acl-input').forEach(el => el.addEventListener('input', updateAcl));
                updateAcl();

            } else if (activeGen === 'get-childitem') {
                ws.innerHTML = applyTheme(`
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Où chercher ? (-Path)</label>
                                <input type="text" id="gci-path" value="C:\\Logs\\" class="gci-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du fichier (-Filter)</label>
                                <input type="text" id="gci-filter" value="*.log" placeholder="Ex: *.txt, rapport_*.pdf" class="gci-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div class="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mt-4">
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="gci-recurse" checked class="gci-input w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600">
                                    <span class="font-bold text-slate-700 dark:text-slate-300">Récursif (-Recurse)</span>
                                </label>
                                <select id="gci-type" class="gci-input bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 text-sm">
                                    <option value="">Tout (Fichiers & Dossiers)</option>
                                    <option value="file" selected>Fichiers uniquement</option>
                                    <option value="dir">Dossiers uniquement</option>
                                </select>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                <h4 class="font-bold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">Filtrage des objets (Where-Object)</h4>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-xs font-bold text-slate-500 mb-1">Taille du fichier (Length)</label>
                                        <div class="flex gap-2">
                                            <select id="gci-size-op" class="gci-input w-1/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 text-sm">
                                                <option value="">Ignorer</option>
                                                <option value="-gt" selected>Plus grand que (>)</option>
                                                <option value="-lt">Plus petit que (<)</option>
                                            </select>
                                            <input type="number" id="gci-size-val" value="1" min="0" class="gci-input w-1/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 text-sm">
                                            <select id="gci-size-unit" class="gci-input w-1/3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200 text-sm">
                                                <option value="MB">Mo (MB)</option>
                                                <option value="GB" selected>Go (GB)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${resultBox('gci')}
                `);

                const updateGci = () => {
                    const path = document.getElementById('gci-path').value || '.';
                    const filter = document.getElementById('gci-filter').value;
                    const recurse = document.getElementById('gci-recurse').checked;
                    const type = document.getElementById('gci-type').value;
                    const sizeOp = document.getElementById('gci-size-op').value;
                    const sizeVal = document.getElementById('gci-size-val').value;
                    const sizeUnit = document.getElementById('gci-size-unit').value;

                    let cmd = `Get-ChildItem -Path "${path}"`;
                    if (recurse) cmd += ` -Recurse`;
                    if (filter) cmd += ` -Filter "${filter}"`;
                    if (type === 'file') cmd += ` -File`;
                    else if (type === 'dir') cmd += ` -Directory`;

                    let where = [];
                    if (sizeOp && sizeVal) {
                        where.push(`$_.Length ${sizeOp} ${sizeVal}${sizeUnit}`);
                    }

                    if (where.length > 0) {
                        cmd += ` | Where-Object { ${where.join(' -and ')} }`;
                    }

                    document.getElementById('gci-result').innerText = cmd;
                    document.getElementById('gci-explain').innerText = "Note : Le paramètre -Filter est beaucoup plus rapide que l'utilisation d'un pipeline '| Where-Object' sur le nom, car il filtre directement au niveau du système de fichiers plutôt qu'en mémoire.";
                };

                ws.querySelectorAll('.gci-input').forEach(el => el.addEventListener('input', updateGci));
                updateGci();

            } else if (activeGen === 'net-ip') {
                ws.innerHTML = applyTheme(`
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de l'interface (-InterfaceAlias)</label>
                                <input type="text" id="net-if" value="Ethernet" placeholder="Ex: Ethernet, Wi-Fi" class="net-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div class="flex gap-4">
                                <div class="flex-grow">
                                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Adresse IP (-IPAddress)</label>
                                    <input type="text" id="net-ip-addr" value="192.168.1.100" class="net-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                </div>
                                <div class="w-1/3">
                                    <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Masque (CIDR)</label>
                                    <input type="number" id="net-prefix" value="24" min="1" max="32" class="net-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                </div>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Passerelle (-DefaultGateway)</label>
                                <input type="text" id="net-gw" value="192.168.1.1" placeholder="Optionnel" class="net-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Serveurs DNS (-ServerAddresses)</label>
                                <input type="text" id="net-dns" value="8.8.8.8, 1.1.1.1" placeholder="Séparés par des virgules" class="net-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                        </div>
                    </div>
                    ${resultBox('net')}
                `);

                const updateNet = () => {
                    const iface = document.getElementById('net-if').value || 'Ethernet';
                    const ip = document.getElementById('net-ip-addr').value || '192.168.1.100';
                    const prefix = document.getElementById('net-prefix').value || '24';
                    const gw = document.getElementById('net-gw').value;
                    const dns = document.getElementById('net-dns').value;

                    let cmd = `New-NetIPAddress -InterfaceAlias "${iface}" -IPAddress "${ip}" -PrefixLength ${prefix}`;
                    if (gw) cmd += ` -DefaultGateway "${gw}"`;

                    if (dns) {
                        const dnsArray = dns.split(',').map(d => `"${d.trim()}"`).join(', ');
                        cmd += `\nSet-DnsClientServerAddress -InterfaceAlias "${iface}" -ServerAddresses ${dnsArray}`;
                    }

                    document.getElementById('net-result').innerText = cmd;
                    document.getElementById('net-explain').innerText = "En PowerShell, la configuration réseau statique nécessite deux commandes distinctes : l'une pour appliquer l'IP/Masque/Passerelle sur la carte, et l'autre pour spécifier les serveurs DNS de la carte.";
                };

                ws.querySelectorAll('.net-input').forEach(el => el.addEventListener('input', updateNet));
                updateNet();
            } else if (activeGen === 'gen-tasks') {
                ws.innerHTML = applyTheme(`
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la tâche</label>
                                <input type="text" id="task-name" value="Backup_Quotidien" class="task-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chemin du script (.ps1)</label>
                                <input type="text" id="task-script" value="C:\\Scripts\\sauvegarde.ps1" class="task-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Déclencheur (Trigger)</label>
                                <select id="task-trigger" class="task-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                    <option value="Daily" selected>Tous les jours (Daily)</option>
                                    <option value="AtStartup">Au démarrage (AtStartup)</option>
                                    <option value="AtLogon">À l'ouverture de session (AtLogon)</option>
                                </select>
                            </div>
                            <div class="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mt-2">
                                <label class="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" id="task-system" checked class="task-input w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600">
                                    <span class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-200">Exécuter en arrière-plan (SYSTEM)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    ${resultBox('task')}
                `);

                const updateTask = () => {
                    const name = document.getElementById('task-name').value || 'MaTache';
                    const script = document.getElementById('task-script').value || 'C:\\script.ps1';
                    const trigger = document.getElementById('task-trigger').value;
                    const isSystem = document.getElementById('task-system').checked ? " -User 'NT AUTHORITY\\SYSTEM' -RunLevel Highest" : "";

                    const oneliner = `$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File "${script}"'; $trigger = New-ScheduledTaskTrigger -${trigger} -At 3am; Register-ScheduledTask -TaskName '${name}' -Action $action -Trigger $trigger${isSystem} -Force`;

                    document.getElementById('task-result').innerText = oneliner;
                    document.getElementById('task-explain').innerText = "One-liner rapide pour déployer une tâche planifiée complète en PowerShell.";
                };

                ws.querySelectorAll('.task-input').forEach(el => el.addEventListener('input', updateTask));
                updateTask();

            } else if (activeGen === 'gen-firewall') {
                ws.innerHTML = applyTheme(`
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la règle</label>
                                <input type="text" id="fw-name" value="Autoriser_Web" class="fw-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Port local</label>
                                <input type="number" id="fw-port" value="443" class="fw-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Protocole</label>
                                <select id="fw-proto" class="fw-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                    <option value="TCP" selected>TCP</option>
                                    <option value="UDP">UDP</option>
                                </select>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Action</label>
                                <select id="fw-action" class="fw-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                    <option value="Allow" selected>Autoriser (Allow)</option>
                                    <option value="Block">Bloquer (Block)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Direction</label>
                                <select id="fw-dir" class="fw-input w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-2 focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200">
                                    <option value="Inbound" selected>Entrant (Inbound)</option>
                                    <option value="Outbound">Sortant (Outbound)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    ${resultBox('fw')}
                `);

                const updateFw = () => {
                    const name = document.getElementById('fw-name').value || 'Regle';
                    const port = document.getElementById('fw-port').value || '80';
                    const proto = document.getElementById('fw-proto').value;
                    const action = document.getElementById('fw-action').value;
                    const dir = document.getElementById('fw-dir').value;

                    document.getElementById('fw-result').innerText = `New-NetFirewallRule -DisplayName "${name}" -Direction ${dir} -LocalPort ${port} -Protocol ${proto} -Action ${action} -Profile Any`;
                    document.getElementById('fw-explain').innerText = "Règle appliquée sur tous les profils (Domain, Private, Public).";
                };

                ws.querySelectorAll('.fw-input').forEach(el => el.addEventListener('input', updateFw));
                updateFw();
            }
        }

        renderTabs();
        renderWorkspace();
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

        appContainer.innerHTML = applyTheme(`
            ${backBtn}
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div class="flex flex-col gap-3 min-w-0 lg:sticky lg:top-28" id="proc-sidebar"></div>
                <div class="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 lg:p-8 flex flex-col relative shadow-sm dark:shadow-lg dark:shadow-black/20 min-w-0" id="proc-content"></div>
            </div>
        `);

        function updateProcSidebar() {
            const sidebar = document.getElementById('proc-sidebar');

            // Groupement par catégorie
            const grouped = procedures.reduce((acc, proc) => {
                if (!acc[proc.category]) acc[proc.category] = [];
                acc[proc.category].push(proc);
                return acc;
            }, {});

            let html = '<div class="flex-grow bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 overflow-y-auto shadow-sm dark:shadow-none lg:max-h-[calc(100vh-10rem)]">';
            for (const [category, procs] of Object.entries(grouped)) {
                html += `<div class="mb-5 last:mb-0">
                            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pl-2 border-l-2 border-pink-500/30">${category}</h3>
                            <ul class="space-y-1">`;
                procs.forEach(proc => {
                    const isActive = currentProc && currentProc.id === proc.id;
                    html += `<li>
                                <button class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${isActive ? 'bg-pink-50 text-pink-800 dark:bg-pink-500/10 dark:text-pink-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}" data-id="${proc.id}">
                                <span>${escapeHtml(proc.title)}</span>
                                <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${proc.difficulty === 'Facile' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/30 text-amber-600 dark:text-amber-400'}">${escapeHtml(proc.difficulty)}</span>
                                </button>
                             </li>`;
                });
                html += `   </ul></div>`;
            }
            html += '</div>';
            sidebar.innerHTML = applyTheme(html);

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
                contentArea.innerHTML = applyTheme(`<div class="flex h-full items-center justify-center text-slate-500 flex-col gap-4 text-center">
                    <svg class="w-16 h-16 text-slate-300 dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    <p>Sélectionnez un tutoriel pour démarrer l'assistant.</p>
                </div>`);
                return;
            }

            const step = currentProc.steps[currentStepIndex];
            const progress = ((currentStepIndex + 1) / currentProc.steps.length) * 100;

            const isFav = favoriteItems.some(f => f.id === currentProc.id && f.type === 'procedure');
            const starIcon = isFav ? `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>` : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>`;
            const starColorClass = isFav ? 'text-amber-500 dark:text-amber-400 hover:text-amber-600' : 'text-slate-500 hover:text-amber-500 dark:hover:text-amber-400';
            const payload = encodeURIComponent(JSON.stringify({ title: currentProc.title, desc: currentProc.description, category: currentProc.category })).replace(/'/g, "%27");

            contentArea.innerHTML = applyTheme(`
                <div class="mb-8 relative">
                    <div class="flex justify-between items-start mb-2">
                    <h2 class="text-3xl font-bold text-slate-800 dark:text-slate-200 pr-12">${escapeHtml(currentProc.title)}</h2>
                        <button data-id="${escapeHtml(currentProc.id)}" data-type="procedure" data-payload="${payload}" onclick="toggleFavorite(this.dataset.id, this.dataset.type, this.dataset.payload, this)" class="absolute right-0 top-0 ${starColorClass} transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-sm" title="Ajouter aux favoris">
                            ${starIcon}
                        </button>
                    </div>
                <p class="text-slate-600 dark:text-slate-400">${sanitizeHtml(currentProc.description)}</p>
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
                    <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">${escapeHtml(step.title)}</h3>
                    <p class="text-slate-700 dark:text-slate-300 text-lg mb-6 leading-relaxed whitespace-pre-wrap">${sanitizeHtml(step.text)}</p>

                    ${step.command ? `
                    <div class="bg-slate-100 dark:bg-black/50 border border-slate-300 dark:border-slate-800 rounded-lg p-4 group relative flex justify-between items-start gap-4 min-w-0">
                        <code class="text-emerald-600 dark:text-emerald-400 font-mono text-sm break-words whitespace-pre-wrap flex-grow min-w-0">${escapeHtml(step.command)}</code>
                        <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${escapeHtml(step.command)}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
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
            `);

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

        const favCommands = favoriteItems.filter(f => f.type === 'command');
        const favKnowledge = favoriteItems.filter(f => f.type === 'knowledge');
        const favProcedures = favoriteItems.filter(f => f.type === 'procedure');

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
            // SECTION: Commandes
            if (favCommands.length > 0) {
                contentHtml += `
                    <div class="mb-6 border-b border-slate-300 dark:border-slate-800 pb-4 mt-8 first:mt-0">
                        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Commandes rapides</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${favCommands.map(cmd => {
                            const payload = encodeURIComponent(JSON.stringify({ name: cmd.name, desc: cmd.desc, example: cmd.example, category: cmd.category })).replace(/'/g, "%27");
                            return `
                            <div class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl p-6 transition-colors flex flex-col h-full shadow-sm dark:shadow-lg dark:shadow-black/20 group min-w-0">
                                <div class="flex justify-between items-start mb-4">
                                <h2 class="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200">${escapeHtml(cmd.name)}</h2>
                                <span class="bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs px-3 py-1 rounded-full border shadow-sm">${escapeHtml(cmd.category)}</span>
                                </div>
                            <p class="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed">${sanitizeHtml(cmd.desc)}</p>
                                <div class="bg-slate-100 dark:bg-black/40 rounded-lg p-3 font-mono text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800/50 flex justify-between items-center gap-4 min-w-0">
                                    <div class="overflow-x-auto whitespace-nowrap hide-scrollbar flex-grow min-w-0">
                                    <span class="text-emerald-500 dark:text-emerald-500/50 mr-2">$</span>${escapeHtml(cmd.example)}
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="copyCommand(this.dataset.cmd, this)" data-cmd="${escapeHtml(cmd.example)}" class="text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Copier la commande">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        </button>
                                        <button data-id="${escapeHtml(cmd.name)}" data-type="command" data-payload="${payload}" onclick="toggleFavorite(this.dataset.id, this.dataset.type, this.dataset.payload, this)" class="text-amber-500 dark:text-amber-400 hover:text-slate-500 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800" title="Retirer des favoris">
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

            // SECTION: Base de connaissances
            if (favKnowledge.length > 0) {
                contentHtml += `
                    <div class="mb-6 border-b border-slate-300 dark:border-slate-800 pb-4 mt-12 first:mt-0">
                        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Base de connaissances</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${favKnowledge.map(item => {
                            const payload = encodeURIComponent(JSON.stringify({ title: item.title, desc: item.desc, category: item.category })).replace(/'/g, "%27");
                            return `
                            <div data-nav-id="${escapeHtml(item.id)}" class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl p-6 transition-colors flex flex-col h-full shadow-sm dark:shadow-lg dark:shadow-black/20 group cursor-pointer relative min-w-0" onclick="if(event.target.closest('button')) return; navigate('knowledge'); setTimeout(() => { const btn = Array.from(document.querySelectorAll('.kb-fiche-btn')).find(b => b.dataset.id === this.dataset.navId); if(btn) btn.click(); }, 100);">
                                <div class="flex justify-between items-start mb-4">
                                <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200 pr-10">${escapeHtml(item.title)}</h2>
                                <span class="bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs px-3 py-1 rounded-full border shadow-sm">${escapeHtml(item.category)}</span>
                                </div>
                            <p class="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed line-clamp-3">${sanitizeHtml(item.desc)}</p>
                                <div class="absolute bottom-4 right-4">
                                    <button data-id="${escapeHtml(item.id)}" data-type="knowledge" data-payload="${payload}" onclick="toggleFavorite(this.dataset.id, this.dataset.type, this.dataset.payload, this)" class="text-amber-500 dark:text-amber-400 hover:text-slate-500 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-sm" title="Retirer des favoris">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            // SECTION: Procédures
            if (favProcedures.length > 0) {
                contentHtml += `
                    <div class="mb-6 border-b border-slate-300 dark:border-slate-800 pb-4 mt-12 first:mt-0">
                        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200">Tutoriels & Procédures</h2>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${favProcedures.map(item => {
                            const payload = encodeURIComponent(JSON.stringify({ title: item.title, desc: item.desc, category: item.category })).replace(/'/g, "%27");
                            return `
                            <div data-nav-id="${escapeHtml(item.id)}" class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-pink-500/50 dark:hover:border-pink-500/50 rounded-xl p-6 transition-colors flex flex-col h-full shadow-sm dark:shadow-lg dark:shadow-black/20 group cursor-pointer relative min-w-0" onclick="if(event.target.closest('button')) return; navigate('procedures'); setTimeout(() => { const btn = Array.from(document.querySelectorAll('button[data-id]')).find(b => b.dataset.id === this.dataset.navId); if(btn) btn.click(); }, 100);">
                                <div class="flex justify-between items-start mb-4">
                                <h2 class="text-xl font-bold text-slate-800 dark:text-slate-200 pr-10">${escapeHtml(item.title)}</h2>
                                <span class="bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-xs px-3 py-1 rounded-full border shadow-sm">${escapeHtml(item.category)}</span>
                                </div>
                            <p class="text-slate-600 dark:text-slate-400 mb-6 flex-grow leading-relaxed line-clamp-3">${sanitizeHtml(item.desc)}</p>
                                <div class="absolute bottom-4 right-4">
                                    <button data-id="${escapeHtml(item.id)}" data-type="procedure" data-payload="${payload}" onclick="toggleFavorite(this.dataset.id, this.dataset.type, this.dataset.payload, this)" class="text-amber-500 dark:text-amber-400 hover:text-slate-500 transition-colors p-2 flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-900 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-sm" title="Retirer des favoris">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                    </button>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        }
        appContainer.innerHTML = applyTheme(backBtn + contentHtml);
    }

    // --- MODULE : QUIZ ---
    function renderQuiz() {
        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;

        let activeQuestions = [];
        let currentIndex = 0;
        let score = 0;

        // --- Écran de Configuration du Quiz ---
        appContainer.innerHTML = applyTheme(`
            ${backBtn}
            <div class="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 md:p-10 shadow-sm dark:shadow-lg dark:shadow-black/20">
                <div class="text-center mb-8">
                    <div class="inline-block p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full border border-amber-300 dark:border-amber-800/50 mb-4 text-amber-600 dark:text-amber-400">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                    </div>
                    <h2 class="text-3xl font-bold text-slate-800 dark:text-slate-200">Configuration du Quiz</h2>
                    <p class="text-slate-600 dark:text-slate-400 mt-2">Choisissez votre mode d'entraînement. Le système tirera 10 questions au hasard.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <button id="mode-mixte" class="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group">
                        <span class="text-4xl mb-3">🎲</span>
                        <h3 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">Mode Mixte</h3>
                        <p class="text-xs text-slate-500 text-center mt-2">Questions théoriques et saisies de commandes alternées.</p>
                    </button>

                    <button id="mode-qcm" class="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group">
                        <span class="text-4xl mb-3">📝</span>
                        <h3 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Théorie (QCM)</h3>
                        <p class="text-xs text-slate-500 text-center mt-2">Uniquement des questions à choix multiples.</p>
                    </button>

                    <button id="mode-input" class="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group">
                        <span class="text-4xl mb-3">⌨️</span>
                        <h3 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Pratique (Saisie)</h3>
                        <p class="text-xs text-slate-500 text-center mt-2">Uniquement de la saisie de commandes dans le terminal.</p>
                    </button>
                </div>
            </div>
        `);

        // Attacher les événements de lancement
        document.getElementById('mode-mixte').addEventListener('click', () => startQuiz('all'));
        document.getElementById('mode-qcm').addEventListener('click', () => startQuiz('qcm'));
        document.getElementById('mode-input').addEventListener('click', () => startQuiz('input'));

        function startQuiz(mode) {
            // Filtrer selon le mode
            let filtered = bashQuiz;
            if (mode !== 'all') {
                filtered = bashQuiz.filter(q => q.type === mode);
            }

            // Mélanger le tableau (Shuffle) et en garder un maximum de 10
            activeQuestions = filtered.sort(() => 0.5 - Math.random()).slice(0, 10);

            currentIndex = 0;
            score = 0;

            // Remplacer l'interface par le conteneur du quiz
            appContainer.innerHTML = applyTheme(`
                ${backBtn}
                <div class="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 md:p-10 shadow-sm dark:shadow-lg dark:shadow-black/20">
                    <div class="text-center mb-8">
                        <div class="inline-block p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full border border-amber-300 dark:border-amber-800/50 mb-4 text-amber-600 dark:text-amber-400">
                            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                        </div>
                        <h2 class="text-3xl font-bold text-slate-800 dark:text-slate-200">Terminal Quiz</h2>
                    </div>
                    <div id="quiz-container"></div>
                </div>
            `);

            renderQuestion();
        }

        function renderQuestion() {
            const container = document.getElementById('quiz-container');
            if (currentIndex >= activeQuestions.length) {
                container.innerHTML = applyTheme(`
                    <div class="text-center py-8">
                        <div class="text-6xl mb-6">🏆</div>
                        <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Quiz Terminé !</h3>
                        <p class="text-lg text-slate-600 dark:text-slate-400 mb-8">Votre score final : <span class="font-bold text-2xl text-amber-500">${score} / ${activeQuestions.length}</span></p>
                        <button onclick="window.navigate('quiz', false)" class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-amber-500/20">Rejouer</button>
                    </div>
                `);
                return;
            }

            const q = activeQuestions[currentIndex];
            let html = `
                <div class="mb-6 flex justify-between items-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                    <span>Question ${currentIndex + 1} sur ${activeQuestions.length}</span>
                    <span class="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Score : ${score}</span>
                </div>
            <h3 class="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-8 leading-relaxed">${escapeHtml(q.q)}</h3>
            `;

            if (q.type === 'qcm') {
                html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${q.o.map(opt => `
                    <button class="quiz-btn-opt text-left px-5 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-800 dark:text-slate-200 font-mono transition-all font-bold text-lg" data-val="${escapeHtml(opt)}">${escapeHtml(opt)}</button>
                    `).join('')}
                </div>`;
            } else if (q.type === 'input') {
                html += `
                    <div class="bg-slate-800 dark:bg-black/60 p-5 rounded-xl font-mono text-xl text-emerald-400 border-2 border-slate-700 dark:border-slate-800 flex items-center gap-3 mb-6 shadow-inner focus-within:border-emerald-500/50 transition-colors">
                        <span class="text-emerald-500/50 select-none">$</span>
                        <input type="text" id="quiz-input-answer" class="bg-transparent border-none outline-none flex-grow text-emerald-400 placeholder-emerald-800/50 w-full" placeholder="tapez la commande..." autocomplete="off" spellcheck="false">
                    </div>
                    <button id="quiz-btn-validate" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-emerald-500/20">Exécuter la commande (Entrée)</button>
                `;
            }

            html += `<div id="quiz-feedback" class="mt-8 hidden rounded-xl p-5 border-2"></div>`;
            container.innerHTML = applyTheme(html);

            const feedbackEl = document.getElementById('quiz-feedback');

            const handleAnswer = (userAnswer) => {
                // Nettoie la réponse de l'utilisateur (enlève les espaces en trop)
                const cleanUserAnswer = userAnswer.trim().toLowerCase();

                // Vérification souple (si q.a est un tableau de bonnes réponses possibles)
                const isCorrect = Array.isArray(q.a) ? q.a.some(ans => ans.toLowerCase() === cleanUserAnswer) : cleanUserAnswer === q.a.toLowerCase();

                if (isCorrect) {
                    playSound('success');
                    score++;
                    if (typeof confetti !== 'undefined') {
                        confetti({
                            particleCount: 120,
                            spread: 80,
                            origin: { y: 0.6 },
                            colors: ['#10b981', '#34d399', '#22d3ee', '#fbbf24'] // Vert, Cyan, Ambre
                        });
                    }
                } else {
                    playSound('error');
                    // Déclenche l'animation de tremblement (shake)
                    const container = document.getElementById('quiz-container');
                    container.classList.remove('animate-shake');
                    void container.offsetWidth; // Force le navigateur à réinitialiser l'animation
                    container.classList.add('animate-shake');
                }

                // Gèle les boutons / champs
                if (q.type === 'qcm') {
                    document.querySelectorAll('.quiz-btn-opt').forEach(btn => {
                        btn.disabled = true;
                        if (btn.dataset.val.toLowerCase() === (Array.isArray(q.a) ? q.a[0].toLowerCase() : q.a.toLowerCase())) btn.classList.add('bg-emerald-100', 'border-emerald-500', 'text-emerald-800', 'dark:bg-emerald-900/40', 'dark:border-emerald-500', 'dark:text-emerald-400');
                        else if (btn.dataset.val.toLowerCase() === cleanUserAnswer && !isCorrect) btn.classList.add('bg-red-100', 'border-red-500', 'text-red-800', 'dark:bg-red-900/40', 'dark:border-red-500', 'dark:text-red-400');
                    });
                } else {
                    const inputEl = document.getElementById('quiz-input-answer');
                    document.getElementById('quiz-btn-validate').disabled = true;
                    inputEl.disabled = true;
                    if (isCorrect) inputEl.parentElement.classList.replace('border-slate-700', 'border-emerald-500');
                    else {
                        inputEl.parentElement.classList.replace('border-slate-700', 'border-red-500');
                        inputEl.classList.replace('text-emerald-400', 'text-red-400');
                    }
                }

                // Affiche l'explication
                const expectedAnswer = Array.isArray(q.a) ? q.a[0] : q.a;

                feedbackEl.innerHTML = `
                    <h4 class="font-bold text-lg mb-2 flex items-center gap-2">${isCorrect ? '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Parfait !' : '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Incorrect.'}</h4>
                    <p class="mb-3">${isCorrect ? 'Excellente maîtrise.' : `La commande attendue était : <span class="font-mono font-bold bg-white/50 dark:bg-black/30 px-2 py-1 rounded ml-1">${escapeHtml(expectedAnswer)}</span>`}</p>
                    <p class="text-sm pt-3 border-t border-current opacity-90 leading-relaxed">💡 ${sanitizeHtml(q.exp)}</p>
                    <button id="quiz-btn-next" class="mt-5 w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl transition-colors shadow-lg">Continuer</button>
                `;
                feedbackEl.className = `mt-8 rounded-xl p-5 border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400'}`;
                feedbackEl.classList.remove('hidden');

                // Permet de passer à la question suivante en appuyant sur Entrée
                window.quizEnterHandler = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextBtn = document.getElementById('quiz-btn-next');
                        if (nextBtn) nextBtn.click();
                    }
                };
                setTimeout(() => {
                    window.addEventListener('keydown', window.quizEnterHandler);
                }, 100);

                document.getElementById('quiz-btn-next').addEventListener('click', () => {
                    window.removeEventListener('keydown', window.quizEnterHandler);
                    currentIndex++;
                    renderQuestion();
                });
            };

            // Ajout des écouteurs d'événements
            if (q.type === 'qcm') {
                document.querySelectorAll('.quiz-btn-opt').forEach(btn => btn.addEventListener('click', (e) => handleAnswer(e.currentTarget.dataset.val)));
            } else {
                const inputEl = document.getElementById('quiz-input-answer');
                document.getElementById('quiz-btn-validate').addEventListener('click', () => handleAnswer(inputEl.value));
                inputEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') handleAnswer(inputEl.value);
                });
                inputEl.focus(); // Met le curseur directement dans la fausse console
            }
        }
    }

    // --- MODULE 5 : LIENS & PROJETS ---
    function renderLinks() {
        const backBtn = `
            <button onclick="navigate('home')" class="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Retour au Dashboard
            </button>
        `;

        appContainer.innerHTML = applyTheme(`
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
        `);
    }

    // Initialisation
    loadAllData().then(() => {
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