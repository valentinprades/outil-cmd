document.addEventListener('DOMContentLoaded', () => {
    // 🎯 Ciblage des conteneurs HTML (à ajouter dans ton interface)
    const generatorSelect = document.getElementById('generator-select');
    const formContainer = document.getElementById('generator-form');
    const onelinerOutput = document.getElementById('oneliner-output');
    const ps1Output = document.getElementById('ps1-output');

    let generators = [];
    let currentGenerator = null;

    // 1️⃣ Charger le fichier JSON
    fetch('psGenerators.json')
        .then(response => response.json())
        .then(data => {
            generators = data;
            initSelect();
        })
        .catch(err => console.error("Erreur de chargement du JSON :", err));

    // 2️⃣ Initialiser la liste déroulante pour choisir le générateur
    function initSelect() {
        if (!generatorSelect) return;

        generators.forEach((gen, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = gen.title;
            generatorSelect.appendChild(option);
        });

        // Changer de formulaire quand l'utilisateur sélectionne un autre outil
        generatorSelect.addEventListener('change', (e) => {
            selectGenerator(generators[e.target.value]);
        });

        // Sélectionner le premier générateur par défaut au chargement
        if (generators.length > 0) {
            selectGenerator(generators[0]);
        }
    }

    // 3️⃣ Afficher le formulaire dynamique correspondant au générateur
    function selectGenerator(gen) {
        currentGenerator = gen;
        if (!formContainer) return;
        formContainer.innerHTML = ''; // Vider le formulaire précédent

        gen.fields.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mb-4';

            const label = document.createElement('label');
            label.className = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
            label.textContent = field.label;

            let input;

            if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500';
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    input.appendChild(option);
                });
            } else if (field.type === 'checkbox') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 mr-2 cursor-pointer';
                input.checked = field.default || false;
            } else {
                input = document.createElement('input');
                input.type = field.type;
                input.className = 'w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500';
                input.placeholder = field.placeholder || '';
            }

            input.id = `field-${field.name}`;

            // 👂 Écouter les changements de frappe pour mettre à jour le code en temps réel
            input.addEventListener('input', updateOutput);
            input.addEventListener('change', updateOutput);

            // Ajout au DOM (Mise en page spéciale pour la checkbox)
            if (field.type === 'checkbox') {
                const flexWrapper = document.createElement('div');
                flexWrapper.className = 'flex items-center mt-2';
                label.className = 'text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer mb-0';
                label.htmlFor = input.id;
                flexWrapper.appendChild(input);
                flexWrapper.appendChild(label);
                wrapper.appendChild(flexWrapper);
            } else {
                wrapper.appendChild(label);
                wrapper.appendChild(input);
            }

            formContainer.appendChild(wrapper);
        });

        updateOutput(); // Générer le code une première fois au chargement
    }

    // 4️⃣ Récupérer les saisies et mettre à jour le code
    function updateOutput() {
        if (!currentGenerator) return;

        const values = {};
        currentGenerator.fields.forEach(field => {
            const el = document.getElementById(`field-${field.name}`);
            // Si c'est une checkbox on prend sa valeur True/False, sinon son Texte
            values[field.name] = field.type === 'checkbox' ? el.checked : el.value;
        });

        if (onelinerOutput) onelinerOutput.textContent = processTemplate(currentGenerator.templates.oneliner, values);
        if (ps1Output) ps1Output.textContent = processTemplate(currentGenerator.templates.ps1, values);
    }

    // 5️⃣ Le Moteur de Template (Remplacement des balises)
    function processTemplate(template, values) {
        let res = template;

        // A. Résoudre les conditions {{#if variable}}...{{/if}}
        const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
        res = res.replace(ifRegex, (match, varName, content) => {
            return values[varName] ? content : '';
        });

        // B. Remplacer les variables simples {{variable}}
        const varRegex = /\{\{(\w+)\}\}/g;
        res = res.replace(varRegex, (match, varName) => {
            // Si l'utilisateur n'a rien tapé, on laisse "[variable]" pour indiquer qu'il manque un truc
            return values[varName] !== undefined && values[varName] !== '' ? values[varName] : `[${varName}]`;
        });

        return res;
    }
});