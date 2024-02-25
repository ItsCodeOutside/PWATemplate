/*
app.js is the main JavaScript file for the app. It handles navigation and deciding how to handle the install prompt.
*/

// Global variables
/*
    allowInstall   - Whether to allow the install prompt to be shown or not
    linkIds        - ID of each nav link, must be manually updated here for now
    installLinkShown - Tracks if install link has been shown or not
    appRunMode     - Overridden by version.txt in checkVersion(), can be used as a flag for extra debug info
    navToggle      - The SVG hamburger menu button
    deferredPrompt - Tracks the install prompt event
*/
const allowInstall = true;
const linkIds = ['homeLink', 'aboutLink', 'tosLink', 'brandLink'];
let installLinkShown = false;
let appRunMode = 'debug';
let navToggle = document.getElementById('navbar-toggler');
let deferredPrompt;

// Show the browser's install prompt when user clicks the install link
function showInstallPrompt(e) {
    e.preventDefault();
	if (deferredPrompt) {
		deferredPrompt.prompt();
		deferredPrompt.userChoice.then((choiceResult) => {
			if (choiceResult.outcome === 'accepted') {
                // Remove install links when PWA is installed
                document.getElementById('nav-install-pwa').remove();
                document.getElementById('footer-install-pwa').remove();
                deferredPrompt = null;
			}
            // You can do something when the user rejects installation with an 'else' here
		});
	}
}

function loadContent(data) {
	document.getElementById('content').innerHTML = data;
}

// changes the URL bar & adds to browse history so it looks like a real page change
function updateAddressBar(url) {
	history.pushState(null, null, url);
}

// When the site is opened from a link or history, the 'current' page will be in the query string's "p" parameter
function getPageFromQueryString() {
	const urlParams = new URLSearchParams(window.location.search);
	let page = urlParams.get('p');
	if (!page) { 
        getPage('home'); 
    }
    else {
        // Remove any trailing hash - sometimes added by refreshes or links within pages
	    getPage(page.replace(/#$/, ''));
    }
}

// When a nav link is clicked, get the page and update the address bar
function getPageByLinkDataTag(e) {
    getPage(e.srcElement.attributes['data-tag'].value);
}

// Attempt to fetch the page and load its content. When PWA is installed, `fetch()` is intercepted and checks the cache first
function getPage(pageName) {
    const pageUrl = `/pages/${pageName}.html`;
    fetch(pageUrl).then(response => {
        if(response.ok) {
            response.text().then(content => {
                loadContent(content);
                updateAddressBar(`?p=${pageName}`);
            });
        }
        else {
            throw new Error('Server returned: ' + response.status + ' ' + response.statusText);
        }
    }).catch(error => {
        if (appRunMode == 'debug')
            console.log('fetch error: ' + error);
    });
}

// Check version and see if we're in debug mode
function checkVersion() {
    if (!navigator.onLine) {
        //use old version number
        if (appRunMode == 'debug')
            console.log('Offline mode');
    }
    else {
        fetch('/version.txt')
        .then(result => {
            // Set debugData to whatever you want to display in the footer while in debug mode
            let debugData = "";
            result.text().then((data) => {
                if (data.substring(0, 6) == 'debug-') { 
                    appRunMode = 'debug'; 
                }
                document.getElementById('appVersion').innerHTML = `${data} ${debugData}`;
            });
        });
    }
}

// Event listeners
//----------------

// When all content is loaded...
document.addEventListener('DOMContentLoaded', function() {

    // Add listener for the PWA install prompt so we can show nice install links to the user
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        if (allowInstall && !installLinkShown) {
            installLinkShown = true;
            // create an install link in the footer
            const installLink = document.createElement('a');
            installLink.id = 'footer-install-pwa';
            installLink.classList.add('install-pwa');
            installLink.textContent = 'Install To Device';
            installLink.href = '#install-pwa';
            installLink.addEventListener('click', showInstallPrompt);
            document.getElementsByTagName('footer')[0].appendChild(installLink);

            // create an install link in the nav
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

    // Check fo the serviceworker and register it
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                if (appRunMode == 'debug')
                    console.log('Service Worker registered with scope:', registration.scope);
            }, function(err) {
                if (appRunMode == 'debug')
                    console.log('Service Worker registration failed:', err);
            });
        });
    }
});