# node-billz: an application to track your bills each month
Everyone has that one sample application they try to build every time they pick up a new language. Some folks like writing 
blogs, some build todo apps, I build a bill calendar.

I have tried tracking monthly bills on calendars and spreadsheets but it was always a pain to keep up with. The people I pay each month rarely change so it is easy to setup a list of bills and due dates. Once that is done Billz handles the rest.

With minimal configuration it is easy to get node-billz up and running. The only requirement is that you have node installed on your machine and a MongoDB database available either on the local machine or hosted at mLab.

Here is a sample configuration file (.env.node-billz)
```
# MONGOLAB_URI=mongodb://localhost:27017/node-billz
MONGODB_URI=mongodb://localhost:27017/node-billz
SESSION_SECRET="super$ecret"
STATUS_URL=/status
```

Also included is the sample env file for the hackathon-starter application that outlines many other options. Much of the cruft has been edited out of the configuration for node-billz, mainly around the passport login strategies. Node-billz supports plain login as well as Google auth.

To use the default settings, simple `cp .env.node-billz .env` to copy the sample settings to the `.env` file which is where the dotenv node plugin expects to find the environemnt variables.

If setting up and running a personal server does not appeal to you, you can check out the demo server here: https://node-billz.now.sh.

Built from https://github.com/sahat/hackathon-starter