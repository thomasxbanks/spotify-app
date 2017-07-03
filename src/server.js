var express = require('express')
var path = require('path')
var app = express()

app.use(express.static(path.join(__dirname, '')))

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views/')

var request = require('request')
var querystring = require('querystring')

app.locals = {
	site: {
		title: 'Music App',
		description: 'This is an app that plays music',
		author: 'thomasxbanks',
		template: 'index'
	},
	auth: {
		keys: {
			client_id: 'b62b812cd26d46059a1bcf355a5d2613',
			client_secret: 'fuck off'
		},
		redirect_uri: 'http://localhost:1337/callback',
		tokens: {
			access_token: '',
			refresh_token: ''
		},
		scopes: 'user-read-private user-read-email'
	}
}

app.get(['/', '/login'], function(req, res) {

	const mySecret = require('./modules/secret.js')
	app.locals.auth.keys.client_secret = mySecret()

	res.locals.statusCode = 200
	res.locals.page = 'home'
	res.locals.content = app.locals.site.description
	res.locals.title = "Welcome!"
	res.locals.user = app.locals.user
	if ((app.locals.auth.tokens.access_token) || (app.locals.auth.tokens.refresh_token)) {
		console.log(app.locals.auth.tokens.access_token, app.locals.auth.tokens.refresh_token)

		res.redirect('/dashboard')

	} else {

		console.log('no tokens - redirecting to login page')

		res.redirect('https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: app.locals.auth.keys.client_id,
				scope: app.locals.auth.scope,
				redirect_uri: app.locals.auth.redirect_uri
			}))
	}


})

app.get('/callback', function(req, res) {

	var code = req.query.code || null

	var authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		form: {
			code: code,
			redirect_uri: app.locals.auth.redirect_uri,
			grant_type: 'authorization_code'
		},
		headers: {
			'Authorization': 'Basic ' + (new Buffer(app.locals.auth.keys.client_id + ':' + app.locals.auth.keys.client_secret).toString('base64'))
		},
		json: true
	}


	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			app.locals.auth.tokens.access_token = body.access_token
			app.locals.auth.tokens.refresh_token = body.refresh_token

			var options = {
				url: 'https://api.spotify.com/v1/me',
				headers: { 'Authorization': 'Bearer ' + app.locals.auth.tokens.access_token },
				json: true
			}

			// use the access token to access the Spotify Web API
			request.get(options, function(error, response, body) {
				app.locals.user = body
				console.log(app.locals)
				res.redirect('/dashboard')
			})



		} else {
			// There has been an error returned
			res.locals = {
				statusCode: response.statusCode,
				title: "Oh noes!",
				content: error
			}
			res.render(app.locals.site.template, res.locals)
		}
	})

})

app.get('/dashboard', function(req, res) {
	console.log(app.locals)
	res.locals = {
		statusCode: 200,
		title: "Dashboard",
		current_user: app.locals.user,
		content: (app.locals.user.display_name) ? app.locals.user.display_name : app.locals.user.id
	}
	res.render(app.locals.site.template, res.locals)
})

// Final catch-all
// keep this last in line to act as the 404 page
app.get('/*', function(req, res) {
	res.locals = {
		statusCode: 404,
		title: "Ooops!",
		content: "This page does not exist."
	}
	res.render(app.locals.site.template, res.locals)
})

app.listen(8008)
