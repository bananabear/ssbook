if (typeof SS == 'undefined') {
	SS = {};
}

(function ($) {

// Shortcut '/' to search bar function
$(function() {
	$(window).keydown(function(e) {
		if ($(e.target).attr("class") == 'dateselect') {
			return;
		}
		if ($(e.target).attr('name') == 'superbar') {
			return;
		}
		if (e.which == 191) { // the '/'
			$('#superbar').focus();
			e.stopPropagation();
			return false;
		}
	});
});

SS.calcWin = function(risk, odds) {
	if(odds > 0) {
		return risk*odds/100;
	} else {
		return risk/odds*-100;
	}
};

SS.calcOdds = function(risk, towin) {
	if (risk == towin) {
		return 100;
	}
	if (risk < towin) {
		return towin*100/risk;
	} else {
		return risk*-100/towin;
	}
};

SS.Superbar = function(selector, Enterbets, Accorselect) {
	this.jSelect = $(selector);

	this.jSelect.keydown($.proxy(this.onKeyPress, this));
	this.jSelect.keyup($.proxy(this.onKeyUp, this));
	this.jSelect.focus($.proxy(this.onFocus, this));
	this.jSelect.blur($.proxy(this.onBlur, this));

	this.url = SS.Cake.base + '/bets/ajax/superbar';
	this.divHeight = '300px';
	this.lastVal = '';

	this.lastRequest = null;

	this.Enterbets = Enterbets;
	this.Accorselect = Accorselect;
	this.doneLoadingBet = true;
};

$.extend(SS.Superbar.prototype, {

	focus : function() {
		this.jSelect.focus();
	},
		
	onBlur: function() {
		this.jSelect.toggleClass('focused');
	},

	getValue : function() {
		return this.jSelect.val();
	},

	onFocus : function(e) {
		this.jSelect.toggleClass('focused');
		if (this.doneLoadingBet) {
			this.lastVal = null;
			this.onKeyUp();
		}
	},

	onKeyUp : function(e) {
		var val = this.getValue();
		if (val != this.lastVal && this.doneLoadingBet) {
			this.request(val);
			this.lastVal = val;
		}
	},

	onKeyPress : function(e) {
		switch (e.which) {
		case 38: // Up
			this.goUp();
			e.stopPropagation();
			return false;
		case 40: // Down
			this.goDown();
			e.stopPropagation();
			return false;
		case 13: // Enter
			this.selectCurrent();
			e.stopPropagation();
			return false;
		}
	},

	getHoverLi : function() {
		if (this['dropdownDiv'] === undefined) {
			return null;
		}
		var out = this.dropdownDiv.find('.hover');
		if (out.length) {
			return out;
		} else {
			return null;
		}
	},

	selectCurrent : function () {
		var hli = this.getHoverLi();
		this.abort();

		if (hli) {
			var text = $.trim(hli.text());
			this.jSelect.val('');
			this.lastVal = text;
			var clazzez = hli.attr('class').split(' ');
			var _this = this;

			$.each(clazzez, function (key, clazz) {
				if (!clazz.match(/scoreid_/)) {
					return false;
				}
				var scoreid = clazz.replace('scoreid_', '');
				_this.gameClick(scoreid);
			});
		} else {
			this.createGame(null);
		}
		this.hideDiv();
	},

	goUp : function() {
		if (this['dropdownDiv'] === undefined) {
			return false;
		}

		var hli = this.getHoverLi();		
		if (hli) {
			hli.removeClass('hover');
			hli.prev().addClass('hover');
		} else {
			this.dropdownDiv.find('li:last').addClass('hover');
		}
	},
	
	goDown : function() {
		if (this['dropdownDiv'] === undefined) {
			return false;
		}

		var hli = this.getHoverLi();		
		if (hli) {
			hli.removeClass('hover');
			hli.next().addClass('hover');
		} else {
			this.dropdownDiv.find('li:first').addClass('hover');
		}
	},

	response : function (data, textStatus) {
		if (!data) {
			return false;
		}
		if (textStatus != 'success') {
			alert('Unable to read from server please try again');
		}
		this.showDropdown(data);
	},

	showDropdown : function (data) {
		if (!data.length) {
			this.hideDiv();
			return false;
		}

		var p = this.jSelect.position();
		var h = this.jSelect.outerHeight();
		var w = this.jSelect.innerWidth();
		var l = p.left;
		var t = p.top + h;
		var _this = this;
		 
		this.createOrShowDiv(t, l, w);

		var html = '<ul>';
		$.each(data, function (key, v) {
			html += '<li class="scoreid_'+v.scoreid+'">'+v.html+'</li>';
		});
		html += '</ul>';
		this.dropdownDiv.html(html).find('li')
			.click($.proxy(this.selectCurrent, this))
			.hover(function() {$(this).addClass('hover')}, function() {$(this).removeClass('hover')})
			.ready($.proxy(this.reposDropdown, this));
	},

	reposDropdown: function() {
		var p = this.jSelect.position();
		var l = p.left;
		$(this.dropdownDiv).css({
			left: l + 'px'
		});
	},

	gameClick : function (scoreid) {
		this.createGame(scoreid);
	},

	createGame : function (scoreid) {
		var data = {scoreid : scoreid};
		if (!scoreid) {
			data['text'] = this.getValue();
		}
		this.doneLoadingBet = false;
		this.Enterbets.done = $.proxy(this, 'enterbetsDone');
		this.Enterbets.add(data);
	},

	enterbetsDone : function() {
		this.doneLoadingBet = true;
	},

	createOrShowDiv : function(t, l, w) {
		if (this['dropdownDiv'] === undefined) {
			var ndiv = $('<div class="dropdown"></div>').appendTo($('body'));
			ndiv.css({
				top : t+'px',
				left : l+'px',
				width : w+'px',
				height : this.divHeight+'px'
			});
			this.dropdownDiv = ndiv;
			$(window).resize($.proxy(this.reposDropdown, this));
		}
		this.dropdownDiv.css('display', 'block');		
		$(window).one('click', $.proxy(this.hideDiv, this));
	},

	hideDiv : function() {
		if (this['dropdownDiv'] !== undefined) {
			this.dropdownDiv.css('display', 'none');
		}
	},

	abort : function() {
		if (this.lastRequest) {
			this.lastRequest.abort();
		}
		this.lastRequest = null;
	},

	request : function(val) {
		this.abort();

		if (val.length >= 2) {
			this.lastRequest = $.getJSON(this.url, {
				text : val,
				startdate: this.Accorselect.getStartdate().toString('yyyy-MM-dd'),
				enddate: this.Accorselect.getEnddate().toString('yyyy-MM-dd')
			}, $.proxy(this.response, this));
		} else {
			this.hideDiv();
		}
	}

});

SS.Enterbets = function(selector) {
	this.jSelect = $(selector);
	this.jBets = null;
	this.url = SS.Cake.base + '/bets/createbets';
	this.ajaxUrl = SS.Cake.base + '/bets/ajax/getbet';
	this.iconurl = SS.Cake.base + '/img/icons/';
	this.idenNumber = 0;
};

SS.Enterbets.TYPES = [
	{name:'spread',desc:"Spread",show:'Spread'},
	{name:'total',desc:"Total",show:'Total'},
	{name:'team_total',desc:"Team Total",show:'Team Total'},
	{name:'moneyline',desc:"M/L",show:''},
	{name:'half_spread',desc:"1st Half Spread",show:'Spread'},
	{name:'half_total',desc:"1st Half Total",show:'Total'},
	{name:'half_team_total',desc:"1st Half Team Total",show:'Team Total'},
	{name:'half_moneyline',desc:"1st Half M/L",show:''},
	{name:'second_spread',desc:"2nd Half Spread",show:'Spread'},
	{name:'second_total',desc:"2nd Half Total",show:'Total'},
	{name:'second_team_total',desc:"2nd Half Team Total",show:'Team Total'},
	{name:'second_moneyline',desc:"2nd Half M/L",show:''}
];

SS.Enterbets.MLB_TYPES = [
	{name:'spread',desc:"Spread",show:'Spread'},
	{name:'total',desc:"Total",show:'Total'},
	{name:'team_total',desc:"Team Total",show:'Team Total'},
	{name:'moneyline',desc:"Moneyline",show:''}
];

$.extend(SS.Enterbets.prototype, {

	render : function() {
		this.jSelect.html("<form action='"+this.url+"' method='post'><div class='bets'>&nbsp;</div><div class='record'><input type='submit' value='Add Bets' /><button id='parlay' type='button'>Parlay/Teaser</button></div>");
		var _this = this;
		this.jSelect.ready(function() {
			_this.jBets = _this.jSelect.find('.bets');
			_this.jSelect.find('form').submit($.proxy(_this.onSubmit, _this));
			_this.jSelect.find('#parlay').click($.proxy(_this, 'onParlay'));
		});
	},

	onParlay : function() {
		var _this = this;
		var parlaybets = this.jBets.find(':checked').parents('.bet');

		var gamesinfo = [];
		var success = !!parlaybets.length && parlaybets.length > 1;
		parlaybets.each(function(key, bet) {
			var info = _this.getBetInfo($(bet));
			success = success && _this.betParlayValid(info);	
			gamesinfo.push(info);
		});

		if (!success) {
			alert('All Bets in Parlay must have a value for spread/total');
			return false;
		}

		this.idenNumber++;
		var iden = 'parlay_'+this.idenNumber;
		var bet = this.renderParlay(gamesinfo, iden);
		var calcedOdd = '', prevCalcedOdd = 100;
		$.each(gamesinfo, function(key, val) {
			if (val.odds == '') {
				calcedOdd = '';
				return false;
			}
			if (calcedOdd == '') {
				calcedOdd = 0;
			}
			calcedOdd = SS.calcWin(prevCalcedOdd, val.odds);
			calcedOdd += prevCalcedOdd;
			prevCalcedOdd = calcedOdd;
		});
		calcedOdd -= 100;
		if (calcedOdd < 100) {
			calcedOdd = Math.round(-1000000/calcedOdd)/100;
		} 

		var _this = this;
		this.jBets.prepend(bet).ready(function() {
			bet.find('.risk').focus();
			bet.find('.odds').val(calcedOdd);
			bet.append(_this.buildBetInput(gamesinfo, iden));
			_this.setupEvents(bet, gamesinfo, iden);
			parlaybets.remove();
		});
		return false;
	},

	buildBetInput : function(parlaybets, iden) {
		var h = '';
		var _this = this;
		$.each(parlaybets, function (key, val) {
			h += '<input type="hidden" name="parlay['+iden+']['+val.iden+']" value="'+_this.betInfoToCSV(val)+'" />';
		});
		return $(h);
	},

	betInfoToCSV : function(betinfo) {
		var ret = [];
		$.each(betinfo, function(key, val) {
			ret.push(key+'='+val);
		});
		return ret.join(';');
	},

	betParlayValid : function(info) {
		switch(info.type) {
		case 'moneyline':
		case 'half_moneyline':
		case 'second_moneyline':
			return true;
		case 'spread':
		case 'half_spread':
		case 'second_spread':
		case 'total':
		case 'half_total':
		case 'second_total':
		case 'team_total':
		case 'half_team_total':
		case 'second_team_total':
			return info.spread != '';
		}			
		return false;
	},

	onSubmit : function () {
		//console.debug('currently submitting');
		if (!this.validateAll()) {
			alert('Unable to validate all');
			return false;
		}
	},

	/**
         * Adding a bet with {scoreid, [text]}
         */
	add : function (data) {
		var _this = this;
		$.getJSON(this.ajaxUrl, data, function(data) {
			_this.done();
			if (data) {
				_this.show(data);
			}
		});
	},

	done : function() {},
	
	astx : '<span class="asterix">*</span>',

	/**
	 * @param <string> iden Identifier "SS[scoreid]" "incremental"
	 */
	renderBet : function (home, homeExtra, visitor, visitExtra, datetime, type, isMLB, iden) {
		var h = '<td class="icon"><img src="'+this.iconurl+'wrong.png"/></td><td><select class="type" name="type['+iden+']">';
		$.each(isMLB ? SS.Enterbets.MLB_TYPES : SS.Enterbets.TYPES, function (key, val) {
			h += '<option value="'+val.name+'"';
			if (val.name == type) {
				h += ' selected="selected"';
			}
			h += '>'+val.desc+'</option>';
		});
		h += '</select></td>';
		h += '<td class="direction">&nbsp;</td>';

		h += '<td><input type="text" class="spread betnumber" name="spread['+iden+']" /></td>';
		h += '<td><input type="text" class="risk betnumber" name="risk['+iden+']" /></td>';
		h += '<td><input type="text" class="odds betnumber" name="odds['+iden+']" /></td>';
		h += '<td><input type="text" class="towin betnumber" name="towin['+iden+']" /></td>';
		h += '<td><input type="text" class="book" name="book['+iden+']" /></td>';
		h += '<td><input type="text" class="tag" name="tag['+iden+']" /></td>';
		var ttl = '<tr><td><input type="checkbox" /></td><td colspan="2">Type</td><td class="type_header">&nbsp;</td><td>'+this.astx+'Risk</td><td>'+this.astx+'Odds</td><td>To Win</td><td>Book</td><td>Tag</td></tr>';

		var datestr = datetime.toString('M/d/yy h:mm tt');
		var date_std = datetime.toString('yyyy-MM-dd HH:mm:ssZ');
		var vextra = '';
		var hextra = '';
		if (isMLB) {
			vextra = (visitExtra) ? ' ('+visitExtra+')' : '';
			hextra = (homeExtra) ? ' ('+homeExtra+')' : '';
		}
		var je = $('<div class="bet"><table><tr><td>&nbsp;</td><td colspan="8" class="teamnames"><span class="teamnames_visitor">'+visitor+'</span>'+vextra+' @ <span class="teamnames_home">'+home+'</span>'+hextra+' <span class="teamnames_datestr">'+datestr+'<input type="hidden" name="date_std['+iden+']" class="date_std" value="'+date_std+'" /></td></td></tr>'+ttl+'<tr>'+h+'</tr></table><div class="close"><img src="'+this.iconurl+'close.png" /></div></div>');
		return je;
	},

	renderParlay : function (gamesinfo, iden) {
		var title = this.titleText(gamesinfo);
		var h = '<div class="bet-parlay"><table><tr><td>&nbsp;</td><td colspan="7">'+title+'</td></tr>';
		h += '<tr><td>&nbsp;</td><td colspan="2">Type</td>';
		h += '<td>Games</td><td>'+this.astx+'Risk</td><td>'+this.astx+'Odds</td><td>To Win</td><td>Book</td></tr>';
		h += '<tr><td class="icon">&nbsp;</td><td>';
		h += '<select name="type['+iden+']"><option value="parlay">Parlay</option><option value="teaser">Teaser</option></select>';
		h += '</td><td>&nbsp;</td>';

		h += '<td>'+gamesinfo.length+'</td>';
		h += '<td><input type="text" class="risk betnumber" name="risk['+iden+']" /></td>';
		h += '<td><input type="text" class="odds betnumber" name="odds['+iden+']" /></td>';
		h += '<td><input type="text" class="towin betnumber" name="towin['+iden+']" /></td>';
		h += '<td><input type="text" class="book" name="book['+iden+']" /></td>';
		h += '</tr><td>&nbsp;</td><td colspan="7" class="gametext">';
		h += this.gameText(gamesinfo);
		h += '</td></tr></table>';
		h += '<div class="close"><img src="'+this.iconurl+'close.png" /></div></div>';

		return $(h);
	},

	titleText : function(gamesinfo) {
		if (!gamesinfo || !gamesinfo.length) {
			return '';
		}
		var t = [];
		$.each(gamesinfo, function(key, val) {
			t.push(val.teamnames);
		});
		return t.join(', ');
	},

	gameText : function(gamesinfo) {
		if (!gamesinfo || !gamesinfo.length) {
			return '';
		}
		var t = '';
		var _this = this;
		$.each(gamesinfo, function(key, val) {
			t += '<div>'+_this.singleGameText(val)+'</div>';
		});
		return t;
	},

	singleGameText : function(game) {
		var t = '';
		var spread = game.spread;
		switch(game.type) {
		case 'moneyline':
		case 'half_moneyline':
		case 'second_moneyline':
			spread = 'M/L';			
		case 'spread':
		case 'half_spread':
		case 'second_spread':
			if (game.direction == 'home') {
				t += game.home;
			} else {
				t += game.visitor;
			}
			return t+ ' '+spread;
		case 'total':
		case 'half_total':
		case 'second_total':
			return game.visitor+' @ '+game.home+' '+game.type+' '+spread;
		case 'team_total':
		case 'half_team_total':
		case 'second_team_total':
			if (game.direction.substr(0,4) == 'home') {
				t += game.home;
			} else {
				t += game.visitor;
			}
			return t+' '+game.type+' '+spread;
		}
		return '';
	},

	getBetInfo : function(bet) {
		var info = {};
		info['teamnames'] = bet.find('.teamnames').text();
		info['home'] = bet.find('.teamnames_home').text();
		info['visitor'] = bet.find('.teamnames_visitor').text();
		info['datestr'] = bet.find('.teamnames_datestr').text();
		info['date_std'] = bet.find('.date_std').val();
		info['spread'] = bet.find('.spread').val();
		var iden = /[a-zA-Z]+[0-9_]+/.exec(bet.find('.risk').attr('name'));
		info['iden'] = iden[0];
		info['risk'] = bet.find('.risk').val();
		info['odds'] = bet.find('.odds').val();
		info['towin'] = bet.find('.book').val();
		info['type'] = bet.find('.type').val();
		info['direction'] = bet.find('.direction select').val();
		return info;
	},

	spreadChange : function(bet, val) {
		//console.debug('spreadChange', bet, val);
		this.validate(bet);
	},

	calcRisk : function(win, odds) {
		if(odds == 0)
			return;

		if(odds > 0) {
			return Math.round(win*10000/odds)/100;
		} else {
			return Math.round(win/-1*odds)/100;
		}
	},

	calcOdds : function (risk, towin) {
		if (risk == 0 || towin == 0) {
			return 0;
		}
	
		return Math.round(SS.calcOdds(risk, towin)*100)/100;
	},
	
	calcWin : function (risk, odds) {
		if(odds == 0)
			return;

		return Math.round(SS.calcWin(risk, odds)*100)/100;
	},

	currentlyChanging : 'risk',

	oddsChange : function(bet, val) {
		var odds = parseFloat(bet.find('.odds').val());
		var towin = parseFloat(bet.find('.towin').val());

		if (odds == 0 || odds == NaN) {
			return;
		}
		this.currentlyChanging = 'odds';
		this.riskChange(bet, val);
		this.validate(bet);
	},

	riskChange : function(bet, val) {
		var towin = parseFloat(bet.find('.towin').val());
		var risk = parseFloat(bet.find('.risk').val());
		var odds = parseFloat(bet.find('.odds').val());
		if (!(isNaN(risk) || isNaN(odds)) && risk > 0 && odds != 0) {
			this.currentlyChanging = 'risk';
			bet.find('.towin').val(this.calcWin(risk, odds));
		}
		if ((!isNaN(towin) && !isNaN(risk)) && (isNaN(odds) || odds == 0 || this.currentlyChanging == 'risk2') && this.currentlyChanging != 'odds') {
			this.currentlyChanging = 'risk2';
			bet.find('.odds').val(this.calcOdds(risk, towin));
		}
		this.validate(bet);
	},
	
	towinChange : function(bet, val) {
		var towin = parseFloat(bet.find('.towin').val());
		var odds = parseFloat(bet.find('.odds').val());
		var risk = parseFloat(bet.find('.risk').val());
		if (!(isNaN(towin) || isNaN(odds)) && towin > 0 && odds != 0 && this.currentlyChanging != 'towin2') {
			this.currentlyChanging = 'towin';
			bet.find('.risk').val(this.calcRisk(towin, odds));
		}
		if ((!isNaN(towin) && !isNaN(risk)) && (isNaN(odds) || odds == 0 || this.currentlyChanging == 'towin2')) {
			this.currentlyChanging = 'towin2';
			bet.find('.odds').val(this.calcOdds(risk, towin));
		}
		this.validate(bet);
	},
	
	typeChange : function(bet, type, data, iden) {
		var _this = this;
		var dir = bet.find('.direction select').val();
		$.each(SS.Enterbets.TYPES, function (key, val) {
			if (val.name == type) {
				var txt = val.show;
				if (txt != '') {
					txt = _this.astx+txt;
				}
				bet.find('.type_header').html(txt);
				return false;
			}
		});
		// Set the other stuff
		var odd = null;
		if (data.odds !== undefined && data.odds.length) {
			$.each(data.odds, function (key, val) {
				if (val.type == type) {
					odd = val;
					return false;
				}
			});
		}
		var h = '<select name="direction['+iden+']">';
		var home = data.home;
		var visitor = data.visitor;
		
		if(type == 'team_total' || type == 'half_team_total' || type == 'second_team_total') {
			var hosel = '';
			var husel = '';
			var vosel = '';
			var vusel = '';

			switch(dir) {
				case 'home_over':
				case 'home':
					hosel = 'selected="selected"';
					break;
				case 'home_under':
					husel = 'selected="selected"';
					break;
				case 'visitor_under':
				case 'under':
					vusel = 'selected="selected"';
					break;
				case 'visitor_over':
				case 'visitor':
				case 'over':
				default:
					vosel = 'selected="selected"';
			}

			h += '<option '+hosel+' value="home_over">'+home+' Over</option>';
			h += '<option '+husel+' value="home_under">'+home+' Under</option>';
			h += '<option '+vosel+' value="visitor_over">'+visitor+' Over</option>';
			h += '<option '+vusel+' value="visitor_under">'+visitor+' Under</option>';
		} else if(type == 'total' || type == 'half_total' || type == 'second_total') {
			var osel = '';
			var usel = '';

			switch(dir) {
				case 'under':
				case 'home_under':
				case 'visitor_under':
					usel = 'selected="selected"';
					break;
				case 'over':
				case 'home_over':
				case 'visitor_over':
				default:
					osel = 'selected="selected"';
			}

			h += '<option '+osel+' value="over">Over</option>';
			h += '<option '+usel+' value="under">Under</option>';
		} else {
			var hsel = '';
			var vsel = '';

			switch(dir) {
				case 'home':
				case 'home_over':
				case 'home_under':
					hsel = 'selected="selected"';
					break;
				case 'visitor':
				case 'visitor_over':
				case 'visitor_under':
				default:
					vsel = 'selected="selected"';
			}

			h += '<option '+hsel+' value="home">'+home+'</option>';
			h += '<option '+vsel+' value="visitor">'+visitor+'</option>';
		}
		h += '</select>';
		var setodd = function() {
			var newdir = bet.find('.direction select').val();
			_this.setOdd(bet, odd, type, newdir);
		}
		bet.find('.direction').html(h).change(setodd).ready(function() {
			if (type == 'moneyline' || type == 'half_moneyline' || type == 'second_moneyline') {
				bet.find('.spread').hide();
			} else {
				bet.find('.spread').show();
			}
			
			setodd(bet, odd, dir);
		});
	},
	
	setOdd : function (bet, odd, type, dir) {
		if (odd) {
			//console.debug('odd', odd);
			switch(type) {
			case 'moneyline':
			case 'half_moneyline':
			case 'second_moneyline':
				bet.find('.spread').val('0');
				if (dir == 'home') {
					bet.find('.odds').val(odd.odds_home);
				} else {
					bet.find('.odds').val(odd.odds_visitor);
				}
				break;
			case 'spread':
			case 'half_spread':
			case 'second_spread':
				if (dir == 'home') {
					bet.find('.spread').val(odd.spread_home);
					bet.find('.odds').val(odd.odds_home);
				} else {
					bet.find('.spread').val(odd.spread_visitor);
					bet.find('.odds').val(odd.odds_visitor);
				}
				break;
			case 'total':
			case 'half_total':
			case 'second_total':
				if (dir == 'over') {
					bet.find('.spread').val(odd.total);
					bet.find('.odds').val(odd.odds_home);
				} else {
					bet.find('.spread').val(odd.total);
					bet.find('.odds').val(odd.odds_visitor);
				}
				break;
			case 'team_total':
			case 'half_team_total':
			case 'second_team_total':
				// We don't have odds values for this type
				bet.find('.spread').val('');
				bet.find('.odds').val('-110');
			}
		} else {
			bet.find('.spread').val('');
			var odds = bet.find('.odds').val();
			if (!odds) {
				bet.find('.odds').val('-110');
			}
		}

		this.oddsChange(bet, bet.find('.odd').val());
		this.validate(bet);
	},

	validate : function(bet) {
		var sels = ['.risk', '.odds', '.towin'];
		var success = true;
		$.each(sels, function(key, val) {
			var v = bet.find(val).val();
			if (v == NaN || v == 0) {
				success = false;
				return false;
			}
		});
		if (success) {
			bet.find('.icon img').attr('src', this.iconurl+'check.png');
			return true;
		} else {
			bet.find('.icon img').attr('src', this.iconurl+'wrong.png');
			return false;
		}
	},

	validateAll : function() {
		var success = true;
		var _this = this;
		this.jBets.find('.bet').each(function (idx, bet) {
			if (!_this.validate($(bet))) {
				success = false;
			}
		});
		return success;
	},

	closeBet : function(bet) {
		//console.debug('close', bet);
		bet.remove();
	},

	setupEvents : function(bet, data, iden) {
		var _this = this;
		bet.find('.spread').keyup(function() {_this.spreadChange(bet, bet.find('.spread').val());});
		bet.find('.spread').change(function() {_this.spreadChange(bet, bet.find('.spread').val());});
		bet.find('.risk').keyup(function() {_this.riskChange(bet, bet.find('.risk').val());});
		bet.find('.risk').change(function() {_this.riskChange(bet, bet.find('.risk').val());});
		bet.find('.odds').keyup(function() {_this.oddsChange(bet, bet.find('.odds').val());});
		bet.find('.odds').change(function() {_this.oddsChange(bet, bet.find('.odds').val());});
		bet.find('.towin').keyup(function() {_this.towinChange(bet, bet.find('.towin').val());});
		bet.find('.towin').change(function() {_this.towinChange(bet, bet.find('.towin').val());});
		bet.find('.close img').click(function() {_this.closeBet(bet);});

		var typeC = function() {_this.typeChange(bet, bet.find('.type').val(), data, iden);};
		bet.find('.type').change(typeC);
		typeC();
	},
	
	show : function (data) {
		var num = this.idenNumber++;
		var iden = 'SS'+data.scoreid+'_'+num;
		var bet = this.renderBet(data.home, data.homeExtra, data.visitor, data.visitExtra, Date.parse(data.game_date), data.type, data.isMLB, iden);
		var _this = this;
		this.jBets.prepend(bet).ready(function() {
			_this.setupEvents(bet, data, iden);
		});
	}

});

SS.Accorselect = function(select, Enterbets, startdateselect, enddateselect) {
	this.jSelect = $(select);
	this.jStartdate = $(startdateselect);
	this.jEnddate = $(enddateselect);
	this.Enterbets = Enterbets;
	this.url = SS.Cake.base + '/bets/ajax/accorselect';
	this.isFocused = false;
	this.hasChanged = false;
}

$.extend(SS.Accorselect.prototype, {
	
	setupDates : function() {
		this.jStartdate.change($.proxy(this.onChange, this));
		this.jEnddate.change($.proxy(this.onChange, this));

		this.jStartdate.focus($.proxy(this.onFocus, this));
		this.jStartdate.blur($.proxy(this.onBlur, this));
		this.jEnddate.focus($.proxy(this.onFocus, this));
		this.jEnddate.blur($.proxy(this.onBlur, this));
	},

	onFocus: function() {
		this.isFocused = true;
	},

	onBlur: function() {
		this.isFocused = false;
		if (this.hasChanged) {
			this.onChange();
		}
	},

	onChange: function() {
		this.hasChanged = true;
		window.setTimeout($.proxy(function() {

			if (!this.hasFocus()) {
				this.find();
			}

		}, this), 10);
	},

	render : function(json) {
		var h = '';
		var leagues = json.leagues;
		var startdate = json.startdate;
		var enddate = json.enddate;
		this.setStartdate(startdate);
		this.setEnddate(enddate);
		this.hasChanged = false;

		$.each(leagues, function(league, games) {
			h += '<h1 class="head">'+league+'</h1><ul>';
			$.each(games, function (key, game) {
				var clazz = '';
				if (game.odds) {
					clazz = ' withodds';
				}
				h += '<li class="selectgame-'+game.scoreid+clazz+'">'+game.desc+'</li>';
			});
			h += '</ul>';
		});

		var _this = this;
		this.jSelect.html(h).ready(function(){
			_this.jSelect.find('.head').click(function() {
				$(this).next().toggle('fast');
				return false;
			}).next().hide();

			_this.jSelect.find('li[class^=selectgame]').click(function() {
				var clazz = $(this).attr('class').split('-');
				var data = {scoreid : parseInt(clazz[1]), accorselect : 1};
				_this.Enterbets.add(data);
				//$(this).parent().toggle('fast');
				return false;
			}).hover(function () {$(this).addClass('hover')}, function() {$(this).removeClass('hover')});
		});
	 },

	setStartdate : function(dt) {
		this.jStartdate.val(dt);
	},

	setEnddate : function(dt) {
		this.jEnddate.val(dt);
	},

	getStartdate : function() {
		return Date.parse(this.jStartdate.val());
	},

	getEnddate : function() {
		return Date.parse(this.jEnddate.val());
	},

	hasFocus: function() {
		return this.isFocused;
	},

	find : function() {
		this.findDates(this.getStartdate(), this.getEnddate());
	},

	findDates : function(startdate, enddate) {
		var _this = this;
		this.jSelect.html('<img src="'+SS.Cake.base+'/img/ajax-loader.gif" />');
		$.getJSON(this.url, {
				startdate : startdate.toString('yyyy-MM-dd'),
				enddate : enddate.toString('yyyy-MM-dd')
			},
			function (json) {
				_this.render(json);
			});
	}
});

$(function() {
	var enterbets = new SS.Enterbets('#enterbets');
	enterbets.render();	
	var accorselect = new SS.Accorselect('#accorselect', enterbets, 'input[name=startdate]', 'input[name=enddate]');
	var superbar = new SS.Superbar('#superbar', enterbets, accorselect);
	accorselect.setupDates();
	accorselect.find();

	superbar.focus();
});

})(jQuery);
