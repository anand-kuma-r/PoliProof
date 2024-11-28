# PoliProof Frontend

PoliProof is a quiz application that allows users to take quizzes on various topics, track their progress, and view results. This README provides an overview of the project, its setup, and usage instructions.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication (Sign Up, Sign In, Logout)
- Dynamic quiz generation based on user ELO rating
- Progress tracking with a visual progress bar
- Multiple-choice questions with instant feedback
- Responsive design for mobile devices

## Technologies Used

- React Native
- Expo
- React Navigation
- React Native Paper
- TypeScript
- Axios (for API calls)

## Installation

For quick setup:
1. Clone the repository:
git clone https://github.com/anand-kuma-r/PoliProof.git

2. Make sure to download the latest version of the Expo Go app from app store. This will allow you to run the app on your phone.

3. Run the backend server.(There is a separate Readme for setting that up)

4. Open up the server using ngrok(https://dashboard.ngrok.com/get-started/setup/windows). Since the server is running locally on your laptop you wont be allowed to make requests to those endpoints from your testing device. Ngrok will allow you to make requests to those endpoints while the server is running locally. 

5. The ngrok output should be a url. For 'example https://aa67-71-35-24-99.ngrok-free.app'. Now take your ngrok url and find the env variable in the app.json file called API_URL and set it to your ngrok url.

6. Now run npm install and npm start. This will start the app and you can view/test the app by scanning the QR code that should show up when all these steps are done correctly. 

7. Enjoy!

