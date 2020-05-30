/*
    Testing on port 3000
*/

const http = require('http');
const https = require('https');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

const port = 3000;
const server = http.createServer();

const unsplash_URL = 'https://api.unsplash.com/';
const credentials = require('./auth/credentials.json');

const cat_URL = 'https://cat-fact.herokuapp.com/facts/random';

const photoFolder_path = './photos/';

// Serve webpage


// Depends if there is an image to display, always a catfact
const serve_webpage = function(unsplash_object, cat_object, random, res){
    let cat_fact = cat_object.text;

    let photo_src = '';
    let author = '';
    let author_link = '';
    let photo_id = '';
    let photo_path = '';


    // The unsplash object is different depending on which endpoint is used
    if(random){
        photo_src = unsplash_object[0]['urls'].small;
        author = unsplash_object[0]['user'].username;
        author_link = unsplash_object[0]['links'].html;
        photo_id = unsplash_object[0].id;

    } else {
        photo_src = unsplash_object['photos']['results'][0]['urls'].small;
        author = unsplash_object['photos']['results'][0]['user'].username;
        author_link = unsplash_object['photos']['results'][0]['user']['links'].html;
        photo_id = unsplash_object['photos']['results'][0].id;
    }

    // Use cached image or download image into chache

    photo_path = `${photoFolder_path}${photo_id}.jpg`;
    
    if(fs.existsSync(photo_path)){
        photo_src = photo_path;

        console.log(`image file-${photo_path}- does exists, using CACHE`);

        let webpage = `
			<!DOCTYPE html>
			<html>
				<head>
                    <title> Photo by ${author}</title>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <style>
                        html {
                            background-color: #5AC167;
                        }
						body{
							margin: 0 ;
						}
						h1, h2, h3{
							text-align: center;
						}
						img{
							display: block;
                            margin-left: auto;
                            margin-right: auto;
						}

					</style>
				</head>
                <body>
                
                    
                    <div>
                    <h2>Here is your photo by ${author}. Find more of their work <a href="${author_link}"> here</a></h2>
                    
                    <img src= ${photo_path} >
                    <h2>And your random cat fact is</h2>
                    <h3>${cat_fact}</h3>
                    
                
                    </div>
                </body>
            </html>`;

    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(webpage);
    } else {
        let photo_req = https.get(photo_src, function(photo_res){
            console.log(`image file-${photo_path}- does NOT exists, downloading photo`);
            let photo = fs.createWriteStream(photo_path,{'encoding':null});
            photo_res.pipe(photo);
            photo.on('finish', function(){
            




                let webpage = `
			<!DOCTYPE html>
			<html>
				<head>
                    <title> Photo by ${author}</title>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <style>
                        html {
                            background-color: #5AC167;
                        }
						body{
							margin: 0 ;
						}
						h1, h2, h3{
							text-align: center;
						}
						img{
							display: block;
                            margin-left: auto;
                            margin-right: auto;
						}

					</style>
				</head>
                <body>
                
                    
                    <div>
                    <h2>Here is your photo by ${author}. Find more of their work <a href="${author_link}"> here</a></h2>
                    
                    <img src="${photo_path}" >
                    <h2>And your random cat fact is</h2>
                    <h3>${cat_fact}</h3>
                    
                
                    </div>
                </body>
            </html>`;

    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(webpage);




            })
        })
    }

    


    // console.log("************\n");
    // console.log(cat_fact);
    // console.log(photo_src);
    // console.log(author);
    // console.log(author_link);
    // console.log(photo_id);



    


}

const serve_noImage_webpage = function(cat_object, res){
    let cat_fact = cat_object.text;

    let webpage = `
			<!DOCTYPE html>
			<html>
				<head>
                    <title> Just a random cat fact </title>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <style>
                        html {
                            background-color: #5AC167;
                        }
						body{
							margin: 0 ;
						}
						h1, h2, h3{
							text-align: center;
						}
						img{
							display: block;
                            margin-left: auto;
                            margin-right: auto;
						}

					</style>
				</head>
                <body>
                
                    
                    <div>
                    <h2>Sorry! that search produced no image result. Don't worry you still get a cat fact</h2>
                    <h3>Your random cat fact is</h3>
                    <h1>${cat_fact}</h1>
                    
                
                    </div>
                </body>
            </html>`;

    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(webpage);
}


// Requests
const create_cat_req = function(unsplash_object, random, res){
    // console.log("calling create_cat_req");
    const cat_req = https.request(cat_URL, function(cat_res) {
            // console.log(`statusCode: ${cat_res.statusCode}`);

		    let body = '';
            cat_res.on('data', (chunk) => {
                body += chunk;
            })
            
		    cat_res.on('end', function(){
                let cat_object = JSON.parse(body);
                
                // console.log(cat_object);

                // If query results in no images then just serve cat_fact
                if( !random && unsplash_object['photos'].total < 1 ) {
                    serve_noImage_webpage(cat_object, res);
                } else {
                    serve_webpage(unsplash_object, cat_object, random, res);
                }
            });

            

        });

        cat_req.on('error', function(err) {
            console.log(err);
            res.writeHead(404, {'Content-Type':'text/html'});
            res.write(`<h3>Error: No Connection to ${err.hostname}<h3/>`);
            res.end();
        });

        cat_req.end();

}


const create_unsplash_req = function(querys_object, res){
    let query_URL = '';
    let random = false;

    // Random case
    if(!(querys_object.random == null)){
        query_URL = `https://api.unsplash.com/photos/random?count=1&client_id=${credentials.client_id}`;
        random = true;
    } else {
        // Checks if color value default
        if(querys_object.color === 'default'){
            console.log('DEFAULT SELECTED');
            querys_object = {"query" : querys_object.query}; // to avoid color=default in query str
        }

        let query_str = querystring.stringify(querys_object);
        // console.log(query_str);
        query_URL = `${unsplash_URL}search?${query_str}&page=1&client_id=${credentials.client_id}`;
        // console.log(query_URL);
    }

    

    
    const unsplash_req = https.request(query_URL, function(unsplash_res){
        let body = '';
        unsplash_res.on('data', (chunk) =>{
            body += chunk;
        });

        unsplash_res.on('end', () => {
            let unsplash_object = JSON.parse(body);

            // console.log(unsplash_object);

            create_cat_req(unsplash_object, random, res);

        });
    });

    unsplash_req.on('error', function(err) {
        console.log(err);
        res.writeHead(404, {'Content-Type':'text/html'});
        res.write(`<h3>Error: No Connection to ${err.hostname}<h3/>`);
        res.end();
    });

    unsplash_req.end();
}


// Routing
const routing_handler = function (req, res){
    console.log(`Getting a request for ${req.url} from ${req.socket.remoteAddress}`);

    // console.log(req);

    if(req.url === '/'){
        const main = fs.createReadStream('html/main.html');
        res.writeHead(200, {'Content-Type':'text/html'});
        main.pipe(res);




    } else if(req.url.startsWith('/search')){


        // console.log(`Handle: ${req.url}`);
        const querys_object = url.parse(req.url, true).query;

        // console.log(querys_object);


        if(!(querys_object.random == null)){
            console.log("RANDOM SELECTED");
        }

        create_unsplash_req(querys_object, res);


    } else if(req.url.startsWith('/css/')){
        const css = fs.createReadStream('css/main.css');
        res.writeHead(200, {'Content-Type':'text/css'});
        css.pipe(res);
    } else if(req.url.startsWith('/photos/')){
        let photo_stream = fs.createReadStream(`.${req.url}`);
        photo_stream.on('error', function(err){
            const error404 = fs.createReadStream('html/404.html');
            res.writeHead(404, {'Content-Type':'text/html'});
            error404.pipe(res);
        });
        photo_stream.on('ready', function(){
            res.writeHead(200, {'Content-Type':'image/jpg'});
            photo_stream.pipe(res);
        })
    } else{
        const error404 = fs.createReadStream('html/404.html');
        res.writeHead(404, {'Content-Type':'text/html'});
        error404.pipe(res);
    }
}




const listening_handler = function(){
    console.log(`Now listening on PORT: ${port}`);
}
// Running the server
server.listen(port);
server.on('listening', listening_handler);

server.on('request', routing_handler);
