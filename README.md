# Welcome to BE part of cd terminal.
## This component is responsible to render a terminal for authenticated users. Also, includes unit tests for important features

### Main tools used
- Node.JS
- bcryptjs
- mongodb

### Steps to run app

### Setup mongodb 
- Check if mongodb is not running if so follow bellow proccess. Otherwise you can skip this section
- To check if mongo is running use this command: ``` ps aux | grep mongod ```
- To start mongod, tun this command: ``` mongod ```

### Install dependencies
``` npm install ```

### Run app
``` npm run start ```

### Run unit tests
``` npm run test ```

### Main features
- Basic register page for user (http://localhost:4000/register) 
- Login page (http://localhost:4000/)
- Terminal screen (http://localhost:4000/ once user is authenticated)

### Terminal features
- cd: Move to a directory using cd command as per described in task. Examples [cd, cd .., cd ../test, cd ./]
- ls: This basically return the last directory from user, does not list all directories yet.
- history: list last commands used. Similar to a history linux command
- clear: clear all things in terminal
- mkdir: comming soon

### TODO LIST
- Improve interface to resemble a real terminal
- Add mkdir feature
- Once mkdir is implemented, adjust ls command to properly handle file hierarchies.

![image](https://github.com/user-attachments/assets/b1193019-6b1b-49c0-a71a-18618ce34ed1)
