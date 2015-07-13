# Krawl
An automatic Web crawler which collects hotel reviews from TripAdvisor.com and stores data in MongoDB.


## Installation

* Install common-node (https://www.npmjs.com/package/common-node)
```bash
sudo npm -g install common-node
sudo npm -g install phantomjs
```
* Install nodejs-legacy (required by common-node)
```bash
sudo apt-get install nodejs-legacy
```

## How to use

1. Edit `src/0-add-city.js`
2. Run `./0-add-cities.sh` to add city data
3. Run `./1-collect-city-hotels.sh` to collect hotel URL's
4. Run `./2-collect-hotel-reviews.sh` to collect reviews URL's (you may need to run it more than once until all pages have been processed).
5. Run `./3-get-reviews-html.sh` to download the HTML content of reviews (you may need to run it more than once until all reviews have been processed).
6. Run `./4-get-blocked-review-html.sh` to download the HTML content of reviews which were blocked in the previous step. many steps (note this runs using nodejs, not common-node).
7. Finally, run `./5-process-review-html.sh` (edit `success_status_code` and `fail_status_code before` running the script)

