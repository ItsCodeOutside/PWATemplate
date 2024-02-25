let deferredPrompt;
let installLinkShown = false;
let appRunMode = 'debug';
let navToggle = document.getElementById('navbar-toggler');
const allowInstall = true;
const linkIds = ['homeLink', 'aboutLink', 'tosLink', 'brandLink'];

function showInstallPrompt(e) {
    e.preventDefault();
	if (deferredPrompt) {
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then((choiceResult) => {
			if (choiceResult.outcome === 'accepted') {
				console.log('User accepted the A2HS prompt');
                document.getElementById('nav-install-pwa').remove();
                document.getElementById('footer-install-pwa').remove();

			} else {
				console.log('User dismissed the A2HS prompt');
			}
			deferredPrompt = null;
		});
	}
}

function loadTemplate(template) {
	document.getElementById('content').innerHTML = template;
}

function updateAddressBar(url) {
	history.pushState(null, null, url);
}

function getPageFromQueryString() {
	const urlParams = new URLSearchParams(window.location.search);
	let page = urlParams.get('p');
	if (!page) { 
        getPage('home'); 
    }
    else {
        // Remove any trailing hash
	    getPage(page.replace(/#$/, ''));
    }
}

function getPageByLinkDataTag(e) {
    getPage(e.srcElement.attributes['data-tag'].value);
}

function getPage(pageName) {
    const pageUrl = `/pages/${pageName}.html`;
    fetch(pageUrl).then(response => {
        if(response.ok) {
            response.text().then(content => {
                loadTemplate(content);
                updateAddressBar(`?p=${pageName}`);
            });
        }
        else {
            throw new Error('Server returned: ' + response.status + ' ' + response.statusText);
        }
    }).catch(error => {
        console.log('fetch error: ' + error);
    });
}

function checkVersion() {
    if (!navigator.onLine) {
        //use old version number
        console.log('Offline mode');
    }
    else {
        fetch('/version.txt')
        .then(result => {
            result.text().then((data) => {
                if (data.substring(0, 6) == 'debug-') { appRunMode = 'debug'; }
                console.log(data);
                document.getElementById('appVersion').innerHTML = data;
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        if (allowInstall && !installLinkShown) {
            installLinkShown = true;
            // Show an install link or call showInstallPrompt() directly
            const installLink = document.createElement('a');
            installLink.id = 'footer-install-pwa';
            installLink.classList.add('install-pwa');
            installLink.textContent = 'Install To Device';
            installLink.href = '#install-pwa';
            installLink.addEventListener('click', showInstallPrompt);
            document.getElementsByTagName('footer')[0].appendChild(installLink);

            const installLink2 = installLink.cloneNode(true);
            const navItem = document.createElement('li');
            navItem.classList.add('nav-item');
            navItem.appendChild(installLink2);
            installLink.id = 'nav-install-pwa';
            installLink2.classList.add('nav-link');
            installLink2.addEventListener('click', showInstallPrompt);
            document.querySelector('#navbarNav ul').appendChild(navItem);
        }
    });

// Add event listeners to the nav links
linkIds.forEach(id => {
    document.getElementById(id).addEventListener('click', (e) => {
        e.preventDefault();
        getPageByLinkDataTag(e);
    });
});


    // Call getPageFromQueryString on page load
    getPageFromQueryString();
    checkVersion();
    // Load the home template by default
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            }, function(err) {
                console.log('Service Worker registration failed:', err);
            });
        });
    }
});