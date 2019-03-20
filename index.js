const express = require('express');
const request = require('request');
const cheerio = require('cheerio');

const app = express()
const port = 3000

app.get('/search/:slug', (req, res) => {
    url = 'https://www.bukalapak.com';
    page = 1;

    if(typeof req.query.page != undefined) {
        page = req.query.page;
    }
    usedUrl = url+"/products?search[keywords]="+req.params.slug+"&page="+page;

    request(
        {uri: usedUrl}, 
        (error, response, body) => {
            var $ = cheerio.load(body);
            var products = $('ul[data-module=product-list]');
            var previous_page = null;
            var next_page = null;
            var current_page = $('div.pagination .current').html();
            
            //previous page
            if($('div.pagination .previous_page').hasClass('disabled')){
                var previous_page = null;
            }else{
                var previous_page = req.protocol + '://' + req.get('host')+"/search/"+req.params.slug+"?page="+(parseInt(current_page)-1)
            }
            //next page
            if($('div.pagination .next_page').hasClass('disabled')){
                var next_page = null;
            }else{
                var next_page = req.protocol + '://' + req.get('host')+"/search/"+req.params.slug+"?page="+(parseInt(current_page)+1)
            }
            
            var json = [];
            var count = 0;
            products.each((index,element)=>{
                var J = cheerio.load(element);
                var Jo = J('li');
                Jo.each((i,el)=>{
                    count++;
                    var Ko = cheerio.load(el);
                    var product_id   = Ko('li div.product-card article.product-display').data('id');
                    var product_type = Ko('li div.product-card article.product-display').data('msg-url-context-class');
                    var product_name = Ko('li div.product-card article.product-display').data('name');
                    var product_url  = url+Ko('li div.product-card article.product-display').data('url');
                    var product_imgs = Ko('li div.product-card div.product-media picture.product-picture img.product-media__img').data('src');
                    var product_imgb = Ko('li div.product-card div.product-media picture.product-picture img.product-media__img').data('src').replace('s-194-194','s-512-512');
                    var status       = Ko('li div.product-card div.product-meta span').html();
                    var seller_name  = Ko('li div.product-card div.product-description div.product-seller div h5.user__name a').html();
                    var seller_url   = url+Ko('li div.product-card div.product-description div.product-seller div h5.user__name a').attr('href');
                    var seller_city  = Ko('li div.product-card div.product-description div.product-seller div div.user-city span').html();
                    var seller_rank  = Ko('li div.product-card div.product-description div.product-seller div div.user-feedback-container div span').html();
                    var seller_stat  = Ko('li div.product-card div.product-description div.product-seller div a.user-feedback-summary div span').html();
                    var product_inst = Ko('li div.product-card div.product-price').data('installment');
                    var product_disc = Ko('li div.product-card div.product-price span span.currency').hasClass('positive') ? false : true;
                    var product_prce = Ko('li div.product-card div.product-price').data('reduced-price');
                    var product_curr = Ko('li div.product-card div.product-price span span.currency').html();
                    var product_rate = Ko('li div.product-card div.product__rating span.rating').attr('title');
                    var product_aggr = Ko('li div.product-card div.product__rating a.review__aggregate span').html();
                    //api exclusive
                    var api_url_prod = req.protocol + '://' + req.get('host') + Ko('li div.product-card article.product-display').data('url');
                    var api_url_user = req.protocol + '://' + req.get('host') + Ko('li div.product-card div.product-description div.product-seller div h5.user__name a').attr('href');
    
                    json.push({
                        'product': {
                            'id': product_id,
                            'type': product_type,
                            'name': product_name,
                            'url': product_url,
                            'image': {
                                'small': product_imgs,
                                'big': product_imgb
                            },
                            'status': status,
                            'meta': {
                                'is_installment': product_inst,
                                'is_discounted': product_disc,
                                'price': product_prce,
                                'currency': product_curr,
                                'rating': product_rate,
                                'aggregate': product_aggr
                            },
                            'api': {
                                'product_detail': api_url_prod,
                                'user_detail': api_url_user
                            },
                            'seller': {
                                'name': seller_name,
                                'fromcity': seller_city,
                                'ranking': seller_rank,
                                'statistic': seller_stat,
                                'url': seller_url
                            }
                        }
                    });
                })
            })
            res.json({
                'data': json,
                'pagination': {
                    'previous': previous_page,
                    'next': next_page,
                    'current': current_page,
                    'data_on_page': count,
                    'original_url': usedUrl
                }
            });
        }
    );
});

app.get('/p/:maincat/:category/:subcat/:slug', (req, res) => {
    url = 'https://www.bukalapak.com';
    fullUrl = url + "/p/" + req.params.maincat + "/" + req.params.category + "/" + req.params.subcat + "/" + req.params.slug;

    request(
        {uri: fullUrl}, 
        (error, response, body) => {
            var $ = cheerio.load(body);
            var product_inst = $('div.product-card div.product-price').data('installment');
            var product_disc = $('div.product-card div.product-price span span.currency').hasClass('positive') ? false : true;
            var product_prce = $('div.product-card div.product-price').data('reduced-price');
            var product_curr = $('div.product-card div.product-price span span.currency').html();
            var product_rate = $('div.product-card div.product__rating span.rating').attr('title');
            var product_aggr = $('div.product-card div.product__rating a.review__aggregate span').html();

            res.json({
                'title': $('title').html().split(' di lapak ')[0].slice(5),
                'installment': product_inst,
                'discount': product_disc,
                'price': product_prce,
                'currency': product_curr,
                'rating': product_rate,
                'aggregate': product_aggr
            });
        }
    );

    // res.send({'params': req.params, 'designated_url': fullUrl});
});

app.get('/u/:slug', (req, res) => {
    res.send(req.params.slug);
});

app.listen(port, () => console.log(`Bukalapak Grep Started on Port: ${port}!`))