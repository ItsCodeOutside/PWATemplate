# PWA Template

This is my simple Progressive Web App template, it is an easy start to creating a small JavaScript web application that visitors can install on their devices to view offline.

## Usage

To use this template for your own small site, simply download the repository and edit at least the files in this list before uploading to your publically accessible HTTPS webspace.

 * manifest.json - Make it relevant to your site
 * pages/home.html - Edit to add your content
 * pages/404.html - Edit to display a "not found" message of your liking
 * pages/* - Add/remove any other pages but make sure to update the nav links
 * index.html - Edit the nav links (CTRL+F _navbarNav_ to find the list)
 * images/* - Replace the examples with your own
 * favicons - Replace with your files

🔴 **WARNING:** PWAs require valid HTTPS to work. If you intend to host locally you will have to set up a trusted TLS site.

## To Do
1. Remove bootstrap.
   - [✔] Set the fonts I like
   - Set styles:
      - [✔] Links
      - Form elements
   - [✔] Set colour scheme as vars
   - [✔] Remove bootstrap CSS & JS

2. [✔] Update footer to gently display install option.

3. [✔] Show install option in menu if not already installed.

4. Come up with a scheme for CRUD content control. (IE:/ An API hosted elsewhere but this is the interface for it)

5. Set up GitHub actions for minify a release when it gets to a point where the static template is just a frontend.

6. Config for nav links

7. Dropdown menu for nav links
