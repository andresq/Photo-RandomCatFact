# Photo & a Random Cat Fact

This project is made to mimic two API synchronously: Given a search string, it uses it in Unsplash's API and then calls Random Cat Facts to display a photo and a random cat fact



## Have API Key stored in ./auth/credentials.json

Have a file in a folder name *auth*

with the name *credentials.json*

that contains the data in of the Unsplash API Key in the format:

`
{
	"client_id": "KEY"
}
`

where 
KEY is the Unsplash Access Key



---
## ./photos/ is the cache location
Photo files are named after their distinct IDs
