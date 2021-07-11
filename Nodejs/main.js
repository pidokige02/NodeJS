var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');  // 사용자가 입력한 경로정보를 세탁하기 위한 module. (hacking 을 방지)
var sanitizeHtml = require('sanitize-html');

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;    
    var pathname = url.parse(_url, true).pathname;
    var title = queryData.id;
    var description = "Hello Node.js";
    if(pathname === '/') {
        if(queryData.id === undefined){
            fs.readdir('./data', function(error, filelist){
                var title = 'Welcome';
                var description = 'Hello, Node.js';
                var list = template.list(filelist);
                var html = template.HTML(title, list, 
                    `<h2>${title}</h2>${description}`,
                    `<a href="/create">create</a>`);
                response.writeHead(200);
                response.end(html);    
            });
        }
        else {
            fs.readdir('./data', function(error, filelist){
                var filteredId = path.parse(queryData.id).base;
                fs.readFile(`data/${filteredId}`,'utf8',function(err, description){
                    var title = queryData.id;
                    var list = template.list(filelist);
                    var sanitizedTitle = sanitizeHtml(title);
                    var sanitizedDescription = sanitizeHtml(description, {
                        allowedTags:['h1']
                    });        
                    var html = template.HTML(title, list, 
                        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
                        `<a href="/create">create</a> 
                        <a href="/update?id=${sanitizedTitle}">update</a>
                        <form action="delete_process" method="post">
                            <input type="hidden" name="id" value="${sanitizedTitle}">
                            <input type="submit" value="delete">
                        </form>`
                    );
                    response.writeHead(200);
                    response.end(html);    
                });
            });
        }
    }else if(pathname === '/create'){
        fs.readdir('./data', function(error, filelist){
            var title = 'WEB - create';
            var list = template.list(filelist);
            var html = template.HTML(title, list, `<form action="/create_process" method="post">
                                                        <p><input type="text" name="title" placeholder="title"></p>
                                                        <p>
                                                        <textarea name="description" placeholder="description"></textarea>
                                                        </p>
                                                        <p>
                                                        <input type="submit">
                                                        </p>
                                                    </form>
                                                    `,'');
            response.writeHead(200);
            response.end(html);    
        });
    }else if(pathname === '/create_process'){
        var body = '';
        request.on('data', function(data){  // post 된 data 가 나뉘어서 들어오기 때문에 들어올때마다 처리함.
            body = body + data;
        });
        request.on('end', function(){ // 마지막으로  data 가 들어왔을때 차리하는 부분임
            var post = qs.parse(body);
            var title = post.title;
            var description = post.description;
            fs.writeFile(`data/${title}`, description, 'utf8', function(err){
                response.writeHead(302, {Location: `/?id=${title}`});   // redirection
                response.end();
                })
        });
    } else if(pathname === '/update'){
        fs.readdir('./data', function(error, filelist){
            var filteredId = path.parse(queryData.id).base;
            fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
                var title = queryData.id;
                var list = template.list(filelist);
                var html = template.HTML(title, list,
                `<form action="/update_process" method="post">
                    <input type="hidden" name="id" value="${title}">
                    <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                    <p>
                    <textarea name="description" placeholder="description">${description}</textarea>
                    </p>
                    <p>
                    <input type="submit">
                    </p>
                    </form>
                `,
                `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
            );
            response.writeHead(200);
            response.end(html);
            });
        });
    }else if(pathname === '/update_process'){
        var body = '';
        request.on('data', function(data){  // post 된 data 가 나뉘어서 들어오기 때문에 들어올때마다 처리함.
            body = body + data;
        });
        request.on('end', function(){   // 마지막으로  data 가 들어왔을때 차리하는 부분임
            var post = qs.parse(body);
            var id = post.id;
            var title = post.title;
            var description = post.description;
            fs.rename(`data/${id}`, `data/${title}`, function(error){
                fs.writeFile(`data/${title}`, description, 'utf8', function(err){
                response.writeHead(302, {Location: `/?id=${title}`});
                response.end();
                })
            });
        });
    }else if(pathname === '/delete_process'){  // delete process 를  post 방식이 아닌 get 방식으로 진행하면 link 를 공유할 때 사고가 생길수 있ㅇㅁ
        var body = '';
        request.on('data', function(data){
            body = body + data;
        });
        request.on('end', function(){
            var post = qs.parse(body);
            var id = post.id;
            var filteredId = path.parse(id).base;
            fs.unlink(`data/${filteredId}`, function(error){
                response.writeHead(302, {Location: `/`});
                response.end();
            })
        });    
    }
    else{
        response.writeHead(404);
        response.end('Not found');    
    }
});

app.listen(52273, function(){
    console.log("Server Listing on port number 52273");
});

// var http = require('http');
// var server = http.createServer(function(request, response){
//     response.writeHead(200, {'Comtent-Type':'text/html'});
//     response.end('<h1>Hello Dalkom IT!</h1>'); 
// });

// server.listen (52273, function(){
//     console.log("Server Listing on port number 52273");
// });