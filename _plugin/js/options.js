"use strict";

function Options() {
	this.opts = this.getDefault();
}

Options.prototype.load = function(callback) {
	var that = this;
	chrome.storage.local.get('opts', function(result) {
		if (result.opts == undefined) {
			that.opts = that.getDefault();
		} else {
			that.opts = result.opts;
		}
		callback(result);
	});
};

Options.prototype.getDefault = function() {
	return {
		General : {
			Enable_augmenting : true,
			Integrate_with_PirateBay : true,
			Integrate_with_Kickass : true
		},
		Integration : {
			Download_one_movie_descryption_at_a_time : true,	
			Show_image_in_the_description_when_present : true
		}
	};
};

Options.prototype.reset = function() {
	this.opts = this.getDefault();
	this.save();
};

Options.prototype.save = function() {
	chrome.storage.local.set({
		'opts' : this.opts
	});
};
