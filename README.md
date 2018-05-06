# booktrader
An app that facilitates the borrowing and lending of books between users.

This app is built upon the code at https://scotch.io/tutorials/easy-node-authentication-setup-and-local.

The home address presents the user with a login/signup page. These processes are validated using passport.js with the 
passport-local package to provide the user with local login functionality. The user must submit their current location 
which is used in the 'Search books' function, and their contact email which is shown privately between borrowers/lenders 
as a means of contact to manage their transactions. Passwords are hashed/validated by bcrypt-nodejs and stored in a 
mongodb database along with the users' other data. Any errors in the authentication process result in a message being 
displayed via connect-flash.

When logged in, a user may change any of their details apart from their username. Via 'My books', they may add books 
they have available and are willing to loan by entering their isbns. This function uses the Open Library Books API, which 
is detailed at https://openlibrary.org/dev/docs/api/books. The added books are appended to the user's information in the 
database. If another user has requested any of these books, their details (including email) will be shown along with an 
option to accept or deny the request. If a book request is accepted, the user's email is made visible to the requester, 
along with an option to cancel the loan. Any book not on loan and without any current requests may be deleted.

Books from others in a specific location can be found via 'Search books', which queries the database with the search 
terms provided in the search bar and displays the matching results. Here a user may request a book they would like to 
borrow, which then can be reviewed via 'My Requests/Borrowings'. Any pending requests may be cancelled here.

The 'My books', 'Search books' and 'My Requests/Borrowings' pages are displayed by passing the users' information gained 
from the database via passport to an ejs template, which are rendered using a single file of embedded react.js code. 
Ideally this should be modularised with the use of a build tool such as webpack.

The CSS files were created by first writing SASS code, and then compiling it with the globally installed node-sass 
package via the command 'npm run sass'.

In development mode, files are served via the '/src' directory which uses the in-browser babel transformer to compile 
jsx and es6 code. A production build is made by running 'npm run compile', which uses the babel-compile package and 
stores files in '/compiled'. The in-browser babel transformer cdn can then be removed from '/compiled/public/stocks.html 
and the body's script tag type changed from 'text/babel' to 'text/javascript'. The compiled files can then be served by 
running 'npm run serve', or 'node compiled/server.js'.

Technologies used in this project:
* node
* express
* html
* sass
* jquery
* bootstrap
* ejs
* mongodb
* mongoose
* react
* passport

Addtional packages of note:
* passport-local
* bcrypt-nodejs
* connect-flash
* babel-compile

