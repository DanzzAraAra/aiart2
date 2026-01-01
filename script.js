const styleList = [
    "default", "ghibli", "cyberpunk", "anime", 
    "portrait", "chibi", "pixel art", "oil painting", "3d"
];

const stylePrompts = {
    default: "Realism",
    ghibli: "Ghibli Art",
    cyberpunk: "Cyberpunk",
    anime: "Anime",
    portrait: "Portrait",
    chibi: "Chibi",
    "pixel art": "Pixel Art",
    "oil painting": "Oil Painting",
    "3d": "3D"
};

const sizeList = {
    "1:1": "1024x1024",
    "3:2": "1080x720",
    "2:3": "720x1080"
};

let selectedStyle = "default";
let selectedSize = "1:1";

const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const loaderArea = document.getElementById('loaderArea');
const emptyState = document.getElementById('emptyState');
const resultArea = document.getElementById('resultArea');
const resultImage = document.getElementById('resultImage');
const styleContainer = document.getElementById('styleContainer');
const sizeContainer = document.getElementById('sizeContainer');

function init() {
    renderStyles();
    renderSizes();
}

function renderStyles() {
    styleContainer.innerHTML = styleList.map(style => `
        <button onclick="selectStyle('${style}')" 
            class="option-btn py-2 px-1 rounded-xl text-[10px] uppercase font-bold tracking-wide ${selectedStyle === style ? 'active' : ''}">
            ${style}
        </button>
    `).join('');
}

function renderSizes() {
    sizeContainer.innerHTML = Object.entries(sizeList).map(([key, val]) => `
        <button onclick="selectSize('${key}')" 
            class="option-btn py-2 px-1 rounded-xl text-[10px] uppercase font-bold tracking-wide ${selectedSize === key ? 'active' : ''}">
            ${key}
        </button>
    `).join('');
}

window.selectStyle = (style) => {
    selectedStyle = style;
    renderStyles();
};

window.selectSize = (key) => {
    selectedSize = key;
    renderSizes();
};

async function callDeepImgApi(prompt, style, sizeKey) {
    const device_id = Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join("");

    const actualSize = sizeList[sizeKey] || "1024x1024";
    const styleSuffix = stylePrompts[style] ? `-style ${stylePrompts[style]}` : "";
    const finalPrompt = `${prompt} ${styleSuffix}`.trim();

    const payload = {
        device_id,
        prompt: finalPrompt,
        size: actualSize,
        n: "1",
        output_format: "png"
    };

    try {
        const response = await fetch("https://api-preview.apirouter.ai/api/v1/deepimg/flux-1-dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const url = data?.data?.images?.[0]?.url;
        
        if (!url) throw new Error("Gagal mendapatkan URL gambar");
        return url;

    } catch (error) {
        throw error;
    }
}

generateBtn.onclick = async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) return showToast("Prompt cannot be empty!", "error");

    generateBtn.disabled = true;
    generateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    loaderArea.classList.remove('hidden');
    
    try {
        const url = await callDeepImgApi(prompt, selectedStyle, selectedSize);
        
        resultImage.src = url;
        resultImage.onload = () => {
            emptyState.classList.add('hidden');
            resultArea.classList.remove('hidden');
            setTimeout(() => resultImage.classList.add('opacity-100'), 50);
            showToast("Successfully created image!", "success");
            
            loaderArea.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        };
    } catch (err) {
        showToast(err.message || "Failed to generate image.", "error");
        loaderArea.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

function resetUI() {
    emptyState.classList.remove('hidden');
    resultArea.classList.add('hidden');
    resultImage.classList.remove('opacity-100');
    promptInput.value = "";
    selectedStyle = "default";
    selectedSize = "1:1";
    renderStyles();
    renderSizes();
}

window.downloadImage = () => {
    if (!resultImage.src) return;
    const a = document.createElement('a');
    a.href = resultImage.src;
    a.download = `kuroneko-${selectedStyle}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

function showToast(msg, type) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msgEl = document.getElementById('toastMsg');
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0";
    
    if (type === 'success') {
        icon.className = `${baseClasses} bg-green-500/20 text-green-500`;
        icon.innerHTML = '✓';
    } else {
        icon.className = `${baseClasses} bg-red-500/20 text-red-500`;
        icon.innerHTML = '✕';
    }
    
    msgEl.innerText = msg;
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

init();
