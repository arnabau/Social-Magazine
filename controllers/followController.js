/***********************************************************
* @package   Social Magazine
* @author    Arnaldo Baumanis
* @copyright 2019
* @license   This project is licensed under the MIT License
************************************************************/

const Follow = require('../models/Follow');

exports.addFollow = function (req, res) {
  let follow = new Follow(req.params.username, req.visitorId);
  follow.create().then(() => {
    req.flash('success', `Successfully followed ${req.params.username}`);
    req.session.save(() => res.redirect(`/profile/${req.params.username}`));
  }).catch((errors) => {
    errors.forEach(error => {
      req.flash('errors', error);
    });
    req.session.save(() => res.redirect('/'));
  });
}


exports.unFollow = function (req, res) {
  let follow = new Follow(req.params.username, req.visitorId);

  follow.delete().then(() => {
    req.flash('success', `Successfully unfollowed ${req.params.username}`);
    req.session.save(() => res.redirect(`/profile/${req.params.username}`));
  }).catch((errors) => {
    errors.forEach(error => {
      req.flash('errors', error);
    });
    req.session.save(() => res.redirect('/'));
  });
}