/**
 * UtilCarousel - Responsive jQuery Carousel Plugin
 * Version: v1.5.1
 * URL: http://codecanyon.net/user/hkeyjun/portfolio
 * Description: Responsive jQuery Carousel Plugin
 * Requires: jQuery 1.7 +
 * Author: Hkeyjun
 * Copyright: Copyright 2014 hkeyjun
 */

(function($, document, window, undefined) {'use strict';

	var pluginName = 'utilCarousel';

	var defaults = {
		responsiveBaseOn : window,
		showItems : 4,
		responsive : true,
		responsiveMode : 'breakPoints',
		responsiveDelay : 200,
		breakPoints : [[480, 1], [768, 2], [992, 3], [1200, 4]],
		itemWidthRange : [100, 400],
		itemWidthRangeConflict : 'margin',
		rangeCaculate : 'maxFirst',
		autoPlay : false,
		pagination : true,
		navigation : false,
		navigationText : ['Prev', 'Next'],
		itemLess : 'margin',
		scrollPerPage : false,
		interval : 3000,
		rewind : true,
		themeClass : 'util-theme-default',
		pauseOnHover : true,
		drag : true,
		mouseWheel : false,
		slideSpeed : 400,
		responsiveSpeed : 400,
		scrollPageSpeed : 600,
		//Callbacks
		beforeInit : null,
		afterInit : null,
		beforeUpdate : null,
		afterUpdate : null,
		indexChanged : null,
		beforeDrag : null,
		afterDrag : null,
		itemAnimation : false,
		lazyLoad : false,
		swipe:true
	};

	function Plugin(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options);

		this.$el = $(element);
		this.$el.data(pluginName, this);

		this._defaults = defaults;
		if(this.$el.parent().is(':visible')){
			this.init();
		}
		else{
			var base = this;
			base.checkInitTimer = window.setInterval(function(){
				if(base.$el.parent().is(':visible')){
					window.clearInterval(base.checkInitTimer);
					base.init();
				}
			},300);
		}
		
		
	}


	Plugin.prototype = {

		init : function() {
			var base = this;

			if ($.isFunction(base.options.beforeInit)) {
				base.options.beforeInit();
			}
			base.getBroswerStatus();
			base.initBaseVars();
			base.buildWrap();
			base.updateUI(false);
			base.$wrapper.css('display', 'block');
			base.loadEvents();
			if (base.options.autoPlay === true) {
				base.play();
			}
			if ($.isFunction(base.options.afterInit)) {
				base.options.afterInit();
			}
			if (base.needCheckVisable) {
				base.checkVisable(0);
			}
		},
		getBroswerStatus : function() {
			var base = this;
			base.isTouch = Modernizr.touch;
			base.transform3d = Modernizr.csstransforms3d;
			base.transform2d = Modernizr.csstransforms;
			base.transition = Modernizr.csstransitions;
			base.cssanimations = Modernizr.cssanimations;

			if (base.transition) {
				var transEndEventNames = {
					'WebkitTransition' : 'webkitTransitionEnd',
					'MozTransition' : 'transitionend',
					'OTransition' : 'oTransitionEnd otransitionend',
					'transition' : 'transitionend'
				};
				base.transitionName = Modernizr.prefixed('transition');
				base.transEndName = transEndEventNames[Modernizr.prefixed('transition')];
				base.emulateTransitionEnd = function($target, duration) {
					var called = false;
					$target.one(base.transEndName, function() {
						called = true;
					});
					var callback = function() {
						if (!called)
							$target.trigger(base.transEndName);
					};
					window.setTimeout(callback, duration);
				};
				base.moveProperty = Modernizr.prefixed('transform');
				if (base.transform3d) {
					base.moveValueMarkup = 'translate3d({0}px,0px,0px)';
				} else {
					base.moveValueMarkup = 'translate({0}px,0px)';
				}
			} else {
				base.moveProperty = "left";
				base.moveValueMarkup = '{0}px';
			}

		},
		initBaseVars : function() {
			var base = this;
			if (window.utilId == undefined) {
				window.utilId = 0;
			}
			base.internalId = window.utilId + 1;
			base.$items = base.$el.children();
			base.itemTotal = base.$items.size();
			base.visiableItemCount = base.options.showItems;
			base.showIndex = 0;
			base.activeIndex = 0;
			base.itemPad = 0;
			base.pageIndex = -1;
			base.isSliding = false;
			base.dragging = false;
			base.playStatus = 'stop';
			base.doAnimation = base.cssanimations == true && base.options.itemAnimation != false;
			base.needCheckVisable = base.doAnimation || base.options.lazyLoad;
			if (base.options.lazyLoad) {
				base.$lazyImages = base.$el.find('.img-lazy[data-src]');
			}
		},
		buildWrap : function() {
			var base = this;
			base.originalClass = base.$el.attr('class') || '';
			if (base.options.themeClass != '' && !base.$el.hasClass(base.options.themeClass)) {
				base.$el.attr('class', 'util-theme-default ' + (base.$el.attr('class') || ''));
			}
			if (!base.$el.hasClass('util-carousel')) {
				base.$el.attr('class', 'util-carousel ' + (base.$el.attr('class') || ''));
			}
			base.$items.wrapAll('<div class="util-wrapper"></div>').wrap('<div class="util-item"></div>');
			base.$utilItems = base.$el.find('.util-item');
			base.$wrapper = base.$el.find('.util-wrapper').wrap('<div class="util-wrapper-holder"></div>');
			base.$wrapperHolder = base.$el.find('.util-wrapper-holder');
			base.$el.css('display', 'block');
			if (base.options.pagination === true) {
				base.$pagination = $('<div class="util-pagination"></div>').appendTo(base.$el);
				//bind pagination event
				base.$pagination.on('click.util touchend', '.util-page', function() {
					var pageIndex = $(this).data('utilIndex');
					if (base.showIndex != pageIndex) {
						base.goTo(pageIndex, base.options.scrollPageSpeed, true);
					}
				});
			}
			if (base.options.navigation === true) {
				base.$navigation = $('<div class="util-navigation"></div>').appendTo(base.$el);
				base.$btnPrev = $('<div class="util-prev">' + base.options.navigationText[0] + '</div>').appendTo(base.$navigation);
				base.$btnNext = $('<div class="util-next">' + base.options.navigationText[1] + '</div>').appendTo(base.$navigation);
				base.$btnPrev.on('click.util', function() {
					base.prev();
				});
				base.$btnNext.on('click.util', function() {
					base.next();
				});
			}
		},
		caculateResponsiveItems : function() {
			var base = this, count = 1, pad = 0;
			var width = $(base.options.responsiveBaseOn).width(), elWidth = base.$wrapperHolder.innerWidth(), minWidth, maxWidth;
			base.holderWidth = elWidth;
			if (base.options.responsive) {
				if (base.options.responsiveMode == 'itemWidthRange') {
					var minmax;
					minmax = base.options.itemWidthRange.sort();
					minWidth = minmax[0];
					maxWidth = minmax[1];
					var maxCount = elWidth / minWidth;
					var minCount = elWidth / maxWidth;

					if (base.options.rangeCaculate === 'minFirst') {
						count = Math.floor(maxCount);
						if (count > 0) {
							if (count < minCount) {
								if (base.options.itemWidthRangeConflict !== 'ajust') {
									pad = elWidth / count - maxWidth;
								}

							}
						} else {
							count = 1;
						}
					} else if (base.options.rangeCaculate === 'maxFirst') {
						count = Math.ceil(minCount);
						if (count > maxCount) {
							count = count - 1;
							if (count > 0) {

								if (base.options.itemWidthRangeConflict !== 'ajust') {
									pad = elWidth / count - maxWidth;
								}

							} else {
								count = 1;
							}
						}
					}
				} else {
					var breakPoints = base.options.breakPoints.sort(function(a, b) {
						return b[0] - a[0];
					});
					count = base.options.showItems > breakPoints[0][1] ? base.options.showItems : breakPoints[0][1];
					for (var i = 0; i < breakPoints.length; i++) {
						if (width <= breakPoints[i][0]) {
							count = breakPoints[i][1];
						} else {
							break;
						}
					}
				}
				if (count > base.itemTotal) {
					//breakPoints
					if (base.options.responsiveMode === 'breakPoints') {
						if (base.options.itemLess === 'margin') {
							pad = elWidth / base.itemTotal - elWidth / count;
							count = base.itemTotal;
						} else if (base.options.itemLess === 'scaleUp') {
							count = base.itemTotal;
						}
					}
					//itemWidthRange
					if (base.options.responsiveMode === 'itemWidthRange') {

						if (base.options.itemLess === 'margin') {
							if (base.options.rangeCaculate === 'minFirst') {
								if (minCount > base.itemTotal) {
									count = base.itemTotal;
									pad = elWidth / count - maxWidth;

								} else {
									count = base.itemTotal;
									pad = 0;
								}
							}
							if (base.options.rangeCaculate === 'maxFirst') {
								count = base.itemTotal;
								pad = elWidth / count - maxWidth;
							}

						}
						if (base.options.itemLess === 'scaleUp') {
							count = base.itemTotal;
							pad = 0;
						}

					}

				}
			} else {
				count = base.options.showItems;
			}

			base.visiableItemCount = count;
			base.itemPad = pad;
			base.itemWidth = elWidth / count;
		},
		caculatePositionArray : function() {
			var base = this;
			base.itemPositions = [];
			base.pagePositions = [];
			base.userItemPositions = [];
			// 1.1 add
			base.pageIndexs = [];
			var lastPageIndex = base.itemTotal - base.visiableItemCount;
			var pageNum = 0;
			for (var i = 0; i < base.itemTotal; i++) {
				base.itemPositions.push(base.itemWidth * i * -1);
				base.userItemPositions.push(base.itemPositions[i] - base.itemPad / 2);
				if ((i % base.visiableItemCount == 0 && i < lastPageIndex) || i == lastPageIndex) {
					pageNum++;
					base.pagePositions.push(base.itemPositions[i]);
					base.pageIndexs.push(i);
				}
				base.$utilItems.eq(i).data('page', pageNum);
			}

		},
		updatePagination : function() {
			var base = this;
			if (base.options.pagination === true) {
				base.$pagination.empty().hide();
				if (base.pagePositions.length > 1) {
					base.$pagination.show();
					for (var i = 0; i < base.pagePositions.length; i++) {
						$('<div class="util-page"><span> </span></div>').data('utilIndex', $.inArray(base.pagePositions[i], base.itemPositions)).appendTo(base.$pagination);
					}
				}
			}
		},
		checkPagination : function() {
			var base = this, pageIndex = 0;
			if (base.options.pagination === true) {
				for (var i = 0; i < base.pageIndexs.length; i++) {
					if (base.showIndex >= base.pageIndexs[i]) {
						pageIndex = i;
					} else {
						break;
					}
				}

				base.$pagination.find('.active-page').removeClass('active-page');
				base.$pagination.find('.util-page').eq(pageIndex).addClass('active-page');
				base.pageIndex = pageIndex;
			}
		},
		checkNavigation : function() {
			var base = this;
			if (base.options.rewind !== true && base.options.navigation === true) {
				base.$btnPrev.removeClass('util-disable');
				base.$btnNext.removeClass('util-disable');
				if (base.showIndex == 0) {
					if (!base.$btnPrev.hasClass('util-disable')) {
						base.$btnPrev.addClass('util-disable');
					}
				}
				if (base.showIndex == base.maxTransItems) {
					if (!base.$btnNext.hasClass('util-disable')) {
						base.$btnNext.addClass('util-disable');
					}
				}
			}
		},
		maxTrans : function() {
			var base = this;
			if (base.visiableItemCount > base.itemTotal) {
				base.maxTransLeft = 0;
				base.maxTransItems = 0;
			} else {
				base.maxTransLeft = (base.itemTotal - base.visiableItemCount) * base.itemWidth;
				base.maxTransItems = base.itemTotal - base.visiableItemCount;
			}
		},

		updateUI : function(animate) {
			var base = this;
			if ($.isFunction(base.options.beforeUpdate)) {
				base.options.beforeUpdate();
			}

			base.caculateResponsiveItems();
			base.maxTrans();
			base.caculatePositionArray();
			base.updatePagination();
			base.checkPagination();
			base.checkNavigation();
			var pad = base.itemPad, count = base.visiableItemCount;
			var perWidth = base.itemWidth;
			var nowWrapperWidth = base.$wrapper.width(), changeWrapperWidth = perWidth * base.itemTotal * 2;

			if (animate) {
				var callback = function() {
				};
				if (nowWrapperWidth <= changeWrapperWidth) {
					base.$wrapper.width(changeWrapperWidth);
					callback = function() {
						base.goTo(base.showIndex, base.options.slideSpeed, true);
					};
				} else {
					callback = function() {
						base.$wrapper.width(changeWrapperWidth);
						base.goTo(base.showIndex, base.options.slideSpeed, true);
					};
				}
				var fullWidth;
				if (base.transition) {
					base.$wrapper.css(base.transitionName, '');
				}
				$.when(base.$utilItems.stop(true, false).animate({
					'width' : perWidth - pad,
					'marginLeft' : pad / 2,
					'marginRight' : pad / 2
				}, {
					duration : base.options.responsiveSpeed,
					step : function(now, fv) {
						if (true) {
							if (fv.prop == 'width') {
								fullWidth = now;
							}
							if (fv.prop == 'marginLeft') {
								fullWidth = fullWidth + 2 * now;
								base.moveTo(-base.showIndex * fullWidth);
							}
						}
					}
				})).then(function() {
					if ($.isFunction(base.options.afterUpdate)) {
						base.options.afterUpdate();
					}
					callback();
				});
			} else {
				base.$wrapper.width(changeWrapperWidth);
				base.$utilItems.css({
					'width' : perWidth - pad,
					'marginLeft' : pad / 2,
					'marginRight' : pad / 2
				});

				if ($.isFunction(base.options.afterUpdate)) {
					base.options.afterUpdate();
				}
			}

			base.resumePlay();
		},
		resizeHandler : function() {
			var base = this;
			var lastWinWidth = $(window).width(), resizeTimer;
			base.doRezise = function() {
				if ($(window).width() != lastWinWidth) {
					window.clearTimeout(resizeTimer);
					base.clearPlay();
					resizeTimer = window.setTimeout(function() {
						var winWidth = $(window).width();
						if (lastWinWidth != winWidth) {
							lastWinWidth = winWidth;
							base.updateUI(true);
						}

					}, base.options.responsiveDelay);
				}
			};
			if (base.options.responsive) {
				$(window).on('resize.util' + base.internalId, base.doRezise);
			}
		},
		dragEvents : function() {
			var base = this;
			Hammer.defaults.stop_browser_behavior.touchAction = 'pan-y';
			var hammerObj = base.$wrapperHolder.hammer({
				drag_min_distance : 1
			});
			
			var startPosition;
			var scrollY;
			var dragTarget;
			hammerObj.on('dragstart', function(ev) {

				scrollY = undefined;
			}).on('drag', function(ev) {
				if (!base.dragging) {

					//Thanks for Russ's fix for android chrome
					if ( typeof scrollY == 'undefined') {
						scrollY = !!(scrollY || Math.abs(ev.gesture.deltaX) < Math.abs(ev.gesture.deltaY) );
						if (!scrollY) {
							ev.gesture.preventDefault();
						}
					}

					if ($.isFunction(base.options.beforeDrag)) {
						base.options.beforeDrag();
					}
					base.clearPlay();
					base.dragging = true;
					startPosition = base.$wrapper.position();
					if (base.transition) {
						base.$wrapper.css(base.transitionName, '');
					} else {
						base.$wrapper.stop();
					}
					if (!base.isTouch) {
						base.$wrapperHolder.addClass('dragging');
						base.$wrapperHolder.css('cursor', base.$wrapperHolder.css('cursor'));
					}

					dragTarget = ev.target || ev.srcElement;

				} else {
					if ( typeof scrollY == 'undefined') {
						scrollY = !!(scrollY || Math.abs(ev.gesture.deltaX) < Math.abs(ev.gesture.deltaY) );
					}

					if ((!scrollY && ev.gesture.pointerType == 'touch') || ev.gesture.pointerType == "mouse") {

						ev.gesture.preventDefault();
						var overRate = 0.6;
						var newPosX;
						if (startPosition.left > 0 || startPosition.left < -base.maxTransLeft) {
							newPosX = ev.gesture.deltaX * overRate + startPosition.left;
						} else {
							newPosX = ev.gesture.deltaX + startPosition.left;
						}

						if (newPosX < -base.maxTransLeft) {
							if (startPosition.left < -base.maxTransLeft) {
								newPosX = startPosition.left + ev.gesture.deltaX * overRate;
							} else {
								newPosX = -base.maxTransLeft + (newPosX - (-base.maxTransLeft)) * overRate;
							}

						}
						if (newPosX > 0) {
							if (startPosition.left > 0) {
								newPosX = startPosition.left + ev.gesture.deltaX * overRate;
							} else {
								newPosX = newPosX * overRate;
							}

						}
						base.dragEndX = newPosX;

						base.moveTo(newPosX);
					}
				}

			}).on('dragend', function(ev) {
				var dragendTarget = ev.target || ev.srcElement;
				if ($(dragTarget).is($(dragendTarget)) && !base.isTouch) {
					$(dragTarget).on('click.util-disableclick', function(evt) {
						evt.stopImmediatePropagation();
						evt.stopPropagation();
						evt.preventDefault();
						$(dragTarget).off('click.util-disableclick');
						return false;
					});
					var eventList = $._data(dragTarget, "events");
					eventList.click.unshift(eventList.click.pop());
				}
				ev.gesture.preventDefault();

				if (ev.gesture.pointerType == 'touch' && scrollY) {
					return;
				}
				ev.gesture.preventDefault();
				base.dragging = false;
				var posArray = base.options.scrollPerPage === true ? base.pagePositions : base.itemPositions;
				var goIndex;
				if (base.dragEndX < -base.maxTransLeft) {
					goIndex = base.itemPositions.length - 1;
				} else if (base.dragEndX > 0) {
					goIndex = 0;
				} else {
					var nextRate = 0.1;
					var nextRateWidth = nextRate * base.itemWidth;
					$.each(posArray, function(index, value) {
						var biger = posArray[index - 1] === undefined ? Number.MAX_VALUE : posArray[index - 1];
						var smaller = posArray[index + 1] === undefined ? -Number.MAX_VALUE : posArray[index + 1];
						if (ev.gesture.deltaX < 0 && base.dragEndX >= value - nextRateWidth && base.dragEndX < biger - nextRateWidth) {
							if (base.options.scrollPerPage === true) {
								goIndex = $.inArray(value, base.itemPositions);
							} else {
								goIndex = index;
							}
						}
						if (ev.gesture.deltaX > 0 && base.dragEndX >= smaller + nextRateWidth && base.dragEndX <= value + nextRateWidth) {
							if (base.options.scrollPerPage === true) {
								goIndex = $.inArray(value, base.itemPositions);
							} else {
								goIndex = index;
							}
						}

					});
				}

				if (!base.isTouch) {
					base.$wrapperHolder.removeClass('dragging');
					base.$wrapperHolder.css('cursor', '');
				}
				if ($.isFunction(base.options.afterDrag)) {
					base.options.afterDrag();
				}
				base.goTo(goIndex, base.options.slideSpeed, true);
			});

		},
		swipeEvents : function() {
			var base = this;
			var hammerObj = Hammer(base.$wrapperHolder.get(0), {
				swipe_velocity : 0.1
			});
			hammerObj.on("swipeleft swiperight", function(ev) {

				ev.gesture.preventDefault();
				if (ev.type == 'dragleft' || ev.type == 'dragright') {
					return;
				} else {
				}
				if (ev.type == 'swipeleft') {
					base.next();
				} else {
					base.prev();
				}
			});

		},
		loadEvents : function() {
			var base = this;
			if (base.options.responsive === true) {
				base.resizeHandler();
			}
			if (base.options.drag === true) {
				base.dragEvents();
			}
			if(base.options.swipe === true)
			{
				base.swipeEvents();
			}
			if (base.options.pauseOnHover === true && base.isTouch !== true) {
				base.pauseOnHover();
			}
			if (base.options.mouseWheel === true) {
				base.$el.on('mousewheel.util', function(evt) {
					evt.stopPropagation();
					evt.preventDefault();
					if (evt.deltaY < 0) {
						base.next();
					}
					if (evt.deltaY > 0) {
						base.prev();
					}
				});
			}
			if (base.options.lazyLoad === true) {
				base.lazyLoadImage();
			}
		},
		moveTo : function(value) {
			var base = this, style = {};
			style[base.moveProperty] = base.moveValueMarkup.replace('{0}', value);
			base.$wrapper.css(style);
			if (base.needCheckVisable) {
				base.checkVisable(value);
			}

		},
		slideTo : function(value, speed) {
			var base = this;
			if (base.transition) {
				base.isSliding = true;
				base.$wrapper.css(base.transitionName, 'all ' + speed + 'ms cubic-bezier(0.215, 0.61, 0.355, 1)');
				base.moveTo(value);
				base.$wrapper.one(base.transEndName, function() {
					base.isSliding = false;
				});
				base.emulateTransitionEnd(base.$wrapper, speed + 50);
			} else {
				base.$wrapper.stop().animate({
					'left' : value
				}, speed, function() {
					base.isSliding = false;
				});
			}
		},
		goTo : function(index, speed, animate) {
			var base = this;
			if (speed === undefined) {
				speed = base.options.slideSpeed;
			}
			if (animate === undefined) {
				animate = true;
			}
			if (index < 0) {
				index = 0;
			}
			if (index > base.maxTransItems) {
				index = base.maxTransItems;
			}
			if (animate === true) {
				base.slideTo(Math.round(base.itemPositions[index]), speed);
				if (base.needCheckVisable) {
					base.checkVisable(base.itemPositions[index]);
				}
			} else {
				if (base.transition) {
					base.$wrapper.css(base.transitionName, '');
				}
				base.moveTo(Math.round(base.itemPositions[index]));
			}
			if (index != base.showIndex && $.isFunction(base.options.indexChanged)) {
				base.options.indexChanged(index);
			}
			base.showIndex = index;
			base.afterGo();
		},
		toStart : function() {
			var base = this;
			base.goTo(0);
		},
		toEnd : function() {
			var base = this;
			base.goTo(base.maxTransItems);
		},
		afterGo : function() {
			var base = this;
			base.checkPagination();
			base.checkNavigation();
			base.resumePlay();
		},
		prev : function() {
			var base = this, prevIndex;
			if (base.options.scrollPerPage === true) {
				prevIndex = base.pageIndex - 1;
				if (base.options.rewind === true && prevIndex < 0) {
					prevIndex = base.pageIndexs.length - 1;
				} else if (base.options.rewind !== true && prevIndex < 0) {
					return false;
				}
				base.goTo(base.pageIndexs[prevIndex], base.options.slideSpeed, true);
			} else {
				prevIndex = base.showIndex - 1;
				if (base.options.rewind === true && prevIndex < 0) {
					prevIndex = base.maxTransItems;
				} else if (base.options.rewind !== true && prevIndex < 0) {
					return false;
				}
				base.goTo(prevIndex, base.options.slideSpeed, true);
			}

		},
		next : function() {
			var base = this, nextIndex;
			if (base.options.scrollPerPage === true) {
				nextIndex = base.pageIndex + 1;
				if (base.options.rewind === true && nextIndex > base.pageIndexs.length - 1) {
					nextIndex = 0;
				} else if (base.options.rewind !== true && nextIndex > base.pageIndexs.length - 1) {
					return false;
				}
				base.goTo(base.pageIndexs[nextIndex], base.options.slideSpeed, true);
			} else {
				nextIndex = base.showIndex + 1;
				if (base.options.rewind === true && nextIndex > base.maxTransItems) {
					nextIndex = 0;
				} else if (base.options.rewind !== true && nextIndex > base.maxTransItems) {
					return false;
				}
				base.goTo(nextIndex, base.options.slideSpeed, true);
			}

		},
		play : function() {
			var base = this;
			base.playStatus = "play";
			window.clearInterval(base.playTimer);
			base.playTimer = window.setInterval(function() {
				base.next();
			}, base.options.interval);
		},
		stop : function() {
			var base = this;
			base.playStatus = 'stop';
			window.clearInterval(base.playTimer);
		},
		resumePlay : function() {
			var base = this;
			if (base.playStatus !== 'stop') {
				base.play();
			}
		},
		clearPlay : function() {
			var base = this;
			window.clearInterval(base.playTimer);
		},
		pauseOnHover : function() {
			var base = this;

			base.$el.on('mouseenter.util', function() {
				base.playStatusBeforHover = base.playStatus;
				if (base.playStatus === 'play') {
					base.stop();
				}
			});
			base.$el.on('mouseleave.util', function() {
				if (base.playStatusBeforHover === "play") {
					if (base.dragging === true) {
						base.playStatus = 'play';
					} else {
						base.play();
					}
				}
			});
		},
		destroy : function() {
			var base = this;

			if (base.$pagination) {
				base.$pagination.remove();
			}
			if (base.$navigation) {
				base.$navigation.remove();
			}
			base.$items.unwrap().unwrap().unwrap();
			$(window).off('resize.util' + base.internalId);
			base.$el.attr('class', base.originalClass).removeData('utilCarousel');
		},
		checkVisable : function(x) {
			var base = this;
			var itemRealWidth = base.itemWidth - base.itemPad;
			var inview = [];
			for (var i = 0; i < base.userItemPositions.length; i++) {
				if (base.userItemPositions[i] > (x - base.holderWidth) && base.userItemPositions[i] <= x || (base.userItemPositions[i] - itemRealWidth) >= (x - base.holderWidth) && (base.userItemPositions[i] - itemRealWidth) < x) {
					inview.push(i);
				}
			}
			var $inviewItems = base.$items.filter(function(index) {
				return $.inArray(index, inview) >= 0;
			});
			if (base.doAnimation) {
				$inviewItems.addClass(base.options.itemAnimation);
				base.$items.not($inviewItems).removeClass(base.options.itemAnimation);
			}
			if (base.options.lazyLoad) {
				var $loaded = $inviewItems.find(base.$lazyImages).trigger('utillazy');
				base.$lazyImages = base.$lazyImages.not($loaded);
			}

		},
		lazyLoadImage : function() {
			var base = this;
			base.$lazyImages.one('utillazy', function() {
				var src = this.getAttribute("data-src");
				this.setAttribute("src", src);
				this.removeAttribute("data-src");
			});
		}
	};

	$.fn[pluginName] = function(options) {
		return this.each(function() {
			if (!$.data(this, pluginName)) {
				$.data(this, pluginName, new Plugin(this, options));
			}
		});
	};

})(jQuery, document, window);

//for lightbox
jQuery(function() {

	if (jQuery.fn.magnificPopup) {
		window.setTimeout(function() {
			jQuery('.util-carousel').each(function() {
				jQuery(this).magnificPopup({
					delegate : '.img-link',
					type : 'image',
					gallery : {
						enabled : true
					}
				});

			});
			jQuery('.video-link').magnificPopup({
				type : 'iframe'
			});
		}, 200);
	}
});

/* Modernizr 2.7.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-cssanimations-csstransforms-csstransforms3d-csstransitions-touch-prefixed-teststyles-testprop-testallprops-prefixes-domprefixes
 */
;window.Modernizr=function(a,b,c){function y(a){i.cssText=a}function z(a,b){return y(l.join(a+";")+(b||""))}function A(a,b){return typeof a===b}function B(a,b){return!!~(""+a).indexOf(b)}function C(a,b){for(var d in a){var e=a[d];if(!B(e,"-")&&i[e]!==c)return b=="pfx"?e:!0}return!1}function D(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:A(f,"function")?f.bind(d||b):f}return!1}function E(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+n.join(d+" ")+d).split(" ");return A(b,"string")||A(b,"undefined")?C(e,b):(e=(a+" "+o.join(d+" ")+d).split(" "),D(e,b,c))}var d="2.7.2",e={},f=b.documentElement,g="modernizr",h=b.createElement(g),i=h.style,j,k={}.toString,l=" -webkit- -moz- -o- -ms- ".split(" "),m="Webkit Moz O ms",n=m.split(" "),o=m.toLowerCase().split(" "),p={},q={},r={},s=[],t=s.slice,u,v=function(a,c,d,e){var h,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:g+(d+1),l.appendChild(j);return h=["&#173;",'<style id="s',g,'">',a,"</style>"].join(""),l.id=g,(m?l:n).innerHTML+=h,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=f.style.overflow,f.style.overflow="hidden",f.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),f.style.overflow=k),!!i},w={}.hasOwnProperty,x;!A(w,"undefined")&&!A(w.call,"undefined")?x=function(a,b){return w.call(a,b)}:x=function(a,b){return b in a&&A(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=t.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(t.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(t.call(arguments)))};return e}),p.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:v(["@media (",l.join("touch-enabled),("),g,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c},p.cssanimations=function(){return E("animationName")},p.csstransforms=function(){return!!E("transform")},p.csstransforms3d=function(){var a=!!E("perspective");return a&&"webkitPerspective"in f.style&&v("@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}",function(b,c){a=b.offsetLeft===9&&b.offsetHeight===3}),a},p.csstransitions=function(){return E("transition")};for(var F in p)x(p,F)&&(u=F.toLowerCase(),e[u]=p[F](),s.push((e[u]?"":"no-")+u));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)x(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof enableClasses!="undefined"&&enableClasses&&(f.className+=" "+(b?"":"no-")+a),e[a]=b}return e},y(""),h=j=null,e._version=d,e._prefixes=l,e._domPrefixes=o,e._cssomPrefixes=n,e.testProp=function(a){return C([a])},e.testAllProps=E,e.testStyles=v,e.prefixed=function(a,b,c){return b?E(a,b,c):E(a,"pfx")},e}(this,this.document);

/*! jQuery plugin for Hammer.JS - v1.0.6 - 2014-03-28
* http://eightmedia.github.com/hammer.js
* Copyright (c) 2014 Jorik Tangelder <j.tangelder@gmail.com>;
* Licensed under the MIT license */
!function(a,b){"use strict";function c(){e.READY||(t.determineEventTypes(),p.each(e.gestures,function(a){v.register(a)}),t.onTouch(e.DOCUMENT,n,v.detect),t.onTouch(e.DOCUMENT,o,v.detect),e.READY=!0)}function d(a,c){Date.now||(Date.now=function(){return(new Date).getTime()}),a.event.bindDom=function(d,e,f){c(d).on(e,function(c){var d=c.originalEvent||c,e=["pageX","pageY","clientX","clientY","target","preventDefault","stopPropagation"];a.utils.each(e,function(a){null==d[a]&&(d[a]=c[a])}),d.which===b&&(d.which=d.button),f.call(this,d)})},a.utils.each(["on","off"],function(b){a.Instance.prototype[b]=function(a,d){return c(this.element)[b](a,d)}}),a.Instance.prototype.trigger=function(a,b){var d=c(this.element);return d.has(b.target).length&&(d=c(b.target)),d.trigger({type:a,gesture:b})},c.fn.hammer=function(b){return this.each(function(){var d=c(this),e=d.data("hammer");e?e&&b&&a.utils.extend(e.options,b):d.data("hammer",new a(this,b||{}))})}}var e=function(a,b){return new e.Instance(a,b||{})};e.VERSION="1.0.10",e.defaults={stop_browser_behavior:{userSelect:"none",touchAction:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}},e.HAS_POINTEREVENTS=a.navigator.pointerEnabled||a.navigator.msPointerEnabled,e.HAS_TOUCHEVENTS="ontouchstart"in a,e.MOBILE_REGEX=/mobile|tablet|ip(ad|hone|od)|android|silk/i,e.NO_MOUSEEVENTS=e.HAS_TOUCHEVENTS&&a.navigator.userAgent.match(e.MOBILE_REGEX),e.EVENT_TYPES={},e.UPDATE_VELOCITY_INTERVAL=16,e.DOCUMENT=a.document;var f=e.DIRECTION_DOWN="down",g=e.DIRECTION_LEFT="left",h=e.DIRECTION_UP="up",i=e.DIRECTION_RIGHT="right",j=e.POINTER_MOUSE="mouse",k=e.POINTER_TOUCH="touch",l=e.POINTER_PEN="pen",m=e.EVENT_START="start",n=e.EVENT_MOVE="move",o=e.EVENT_END="end";e.plugins=e.plugins||{},e.gestures=e.gestures||{},e.READY=!1;var p=e.utils={extend:function(a,c,d){for(var e in c)a[e]!==b&&d||(a[e]=c[e]);return a},each:function(a,c,d){var e,f;if("forEach"in a)a.forEach(c,d);else if(a.length!==b){for(e=-1;f=a[++e];)if(c.call(d,f,e,a)===!1)return}else for(e in a)if(a.hasOwnProperty(e)&&c.call(d,a[e],e,a)===!1)return},inStr:function(a,b){return a.indexOf(b)>-1},hasParent:function(a,b){for(;a;){if(a==b)return!0;a=a.parentNode}return!1},getCenter:function(a){var b=[],c=[],d=[],e=[],f=Math.min,g=Math.max;return 1===a.length?{pageX:a[0].pageX,pageY:a[0].pageY,clientX:a[0].clientX,clientY:a[0].clientY}:(p.each(a,function(a){b.push(a.pageX),c.push(a.pageY),d.push(a.clientX),e.push(a.clientY)}),{pageX:(f.apply(Math,b)+g.apply(Math,b))/2,pageY:(f.apply(Math,c)+g.apply(Math,c))/2,clientX:(f.apply(Math,d)+g.apply(Math,d))/2,clientY:(f.apply(Math,e)+g.apply(Math,e))/2})},getVelocity:function(a,b,c){return{x:Math.abs(b/a)||0,y:Math.abs(c/a)||0}},getAngle:function(a,b){var c=b.clientX-a.clientX,d=b.clientY-a.clientY;return 180*Math.atan2(d,c)/Math.PI},getDirection:function(a,b){var c=Math.abs(a.clientX-b.clientX),d=Math.abs(a.clientY-b.clientY);return c>=d?a.clientX-b.clientX>0?g:i:a.clientY-b.clientY>0?h:f},getDistance:function(a,b){var c=b.clientX-a.clientX,d=b.clientY-a.clientY;return Math.sqrt(c*c+d*d)},getScale:function(a,b){return a.length>=2&&b.length>=2?this.getDistance(b[0],b[1])/this.getDistance(a[0],a[1]):1},getRotation:function(a,b){return a.length>=2&&b.length>=2?this.getAngle(b[1],b[0])-this.getAngle(a[1],a[0]):0},isVertical:function(a){return a==h||a==f},toggleDefaultBehavior:function(a,b,c){if(b&&a&&a.style){p.each(["webkit","moz","Moz","ms","o",""],function(d){p.each(b,function(b,e){d&&(e=d+e.substring(0,1).toUpperCase()+e.substring(1)),e in a.style&&(a.style[e]=!c&&b)})});var d=function(){return!1};"none"==b.userSelect&&(a.onselectstart=!c&&d),"none"==b.userDrag&&(a.ondragstart=!c&&d)}}};e.Instance=function(a,b){var d=this;return c(),this.element=a,this.enabled=!0,this.options=p.extend(p.extend({},e.defaults),b||{}),this.options.stop_browser_behavior&&p.toggleDefaultBehavior(this.element,this.options.stop_browser_behavior,!1),this.eventStartHandler=t.onTouch(a,m,function(a){d.enabled&&v.startDetect(d,a)}),this.eventHandlers=[],this},e.Instance.prototype={on:function(a,b){var c=a.split(" ");return p.each(c,function(a){this.element.addEventListener(a,b,!1),this.eventHandlers.push({gesture:a,handler:b})},this),this},off:function(a,b){var c,d,e=a.split(" ");return p.each(e,function(a){for(this.element.removeEventListener(a,b,!1),c=-1;d=this.eventHandlers[++c];)d.gesture===a&&d.handler===b&&this.eventHandlers.splice(c,1)},this),this},trigger:function(a,b){b||(b={});var c=e.DOCUMENT.createEvent("Event");c.initEvent(a,!0,!0),c.gesture=b;var d=this.element;return p.hasParent(b.target,d)&&(d=b.target),d.dispatchEvent(c),this},enable:function(a){return this.enabled=a,this},dispose:function(){var a,b;for(this.options.stop_browser_behavior&&p.toggleDefaultBehavior(this.element,this.options.stop_browser_behavior,!0),a=-1;b=this.eventHandlers[++a];)this.element.removeEventListener(b.gesture,b.handler,!1);return this.eventHandlers=[],t.unbindDom(this.element,e.EVENT_TYPES[m],this.eventStartHandler),null}};var q=null,r=!1,s=!1,t=e.event={bindDom:function(a,b,c){var d=b.split(" ");p.each(d,function(b){a.addEventListener(b,c,!1)})},unbindDom:function(a,b,c){var d=b.split(" ");p.each(d,function(b){a.removeEventListener(b,c,!1)})},onTouch:function(a,b,c){var d=this,f=function(f){var g=f.type.toLowerCase();if(!p.inStr(g,"mouse")||!s){p.inStr(g,"touch")||p.inStr(g,"pointerdown")||p.inStr(g,"mouse")&&1===f.which?r=!0:p.inStr(g,"mouse")&&!f.which&&(r=!1),(p.inStr(g,"touch")||p.inStr(g,"pointer"))&&(s=!0);var h=0;r&&(e.HAS_POINTEREVENTS&&b!=o?h=u.updatePointer(b,f):p.inStr(g,"touch")?h=f.touches.length:s||(h=p.inStr(g,"up")?0:1),h>0&&b==o?b=n:h||(b=o),(h||null===q)&&(q=f),c.call(v,d.collectEventData(a,b,d.getTouchList(q,b),f)),e.HAS_POINTEREVENTS&&b==o&&(h=u.updatePointer(b,f))),h||(q=null,r=!1,s=!1,u.reset())}};return this.bindDom(a,e.EVENT_TYPES[b],f),f},determineEventTypes:function(){var a;a=e.HAS_POINTEREVENTS?u.getEvents():e.NO_MOUSEEVENTS?["touchstart","touchmove","touchend touchcancel"]:["touchstart mousedown","touchmove mousemove","touchend touchcancel mouseup"],e.EVENT_TYPES[m]=a[0],e.EVENT_TYPES[n]=a[1],e.EVENT_TYPES[o]=a[2]},getTouchList:function(a){return e.HAS_POINTEREVENTS?u.getTouchList():a.touches?a.touches:(a.identifier=1,[a])},collectEventData:function(a,b,c,d){var e=k;return(p.inStr(d.type,"mouse")||u.matchType(j,d))&&(e=j),{center:p.getCenter(c),timeStamp:Date.now(),target:d.target,touches:c,eventType:b,pointerType:e,srcEvent:d,preventDefault:function(){var a=this.srcEvent;a.preventManipulation&&a.preventManipulation(),a.preventDefault&&a.preventDefault()},stopPropagation:function(){this.srcEvent.stopPropagation()},stopDetect:function(){return v.stopDetect()}}}},u=e.PointerEvent={pointers:{},getTouchList:function(){var a=[];return p.each(this.pointers,function(b){a.push(b)}),a},updatePointer:function(a,b){return a==o?delete this.pointers[b.pointerId]:(b.identifier=b.pointerId,this.pointers[b.pointerId]=b),Object.keys(this.pointers).length},matchType:function(a,b){if(!b.pointerType)return!1;var c=b.pointerType,d={};return d[j]=c===j,d[k]=c===k,d[l]=c===l,d[a]},getEvents:function(){return["pointerdown MSPointerDown","pointermove MSPointerMove","pointerup pointercancel MSPointerUp MSPointerCancel"]},reset:function(){this.pointers={}}},v=e.detection={gestures:[],current:null,previous:null,stopped:!1,startDetect:function(a,b){this.current||(this.stopped=!1,this.current={inst:a,startEvent:p.extend({},b),lastEvent:!1,lastVelocityEvent:!1,velocity:!1,name:""},this.detect(b))},detect:function(a){if(this.current&&!this.stopped){a=this.extendEventData(a);var b=this.current.inst,c=b.options;return p.each(this.gestures,function(d){return this.stopped||c[d.name]===!1||b.enabled===!1||d.handler.call(d,a,b)!==!1?void 0:(this.stopDetect(),!1)},this),this.current&&(this.current.lastEvent=a),a.eventType==o&&!a.touches.length-1&&this.stopDetect(),a}},stopDetect:function(){this.previous=p.extend({},this.current),this.current=null,this.stopped=!0},getVelocityData:function(a,b,c,d){var f=this.current,g=f.lastVelocityEvent,h=f.velocity;g&&a.timeStamp-g.timeStamp>e.UPDATE_VELOCITY_INTERVAL?(h=p.getVelocity(a.timeStamp-g.timeStamp,a.center.clientX-g.center.clientX,a.center.clientY-g.center.clientY),f.lastVelocityEvent=a):f.velocity||(h=p.getVelocity(b,c,d),f.lastVelocityEvent=a),f.velocity=h,a.velocityX=h.x,a.velocityY=h.y},getInterimData:function(a){var b,c,d=this.current.lastEvent;a.eventType==o?(b=d&&d.interimAngle,c=d&&d.interimDirection):(b=d&&p.getAngle(d.center,a.center),c=d&&p.getDirection(d.center,a.center)),a.interimAngle=b,a.interimDirection=c},extendEventData:function(a){var b=this.current,c=b.startEvent;(a.touches.length!=c.touches.length||a.touches===c.touches)&&(c.touches=[],p.each(a.touches,function(a){c.touches.push(p.extend({},a))}));var d=a.timeStamp-c.timeStamp,e=a.center.clientX-c.center.clientX,f=a.center.clientY-c.center.clientY;return this.getVelocityData(a,d,e,f),this.getInterimData(a),p.extend(a,{startEvent:c,deltaTime:d,deltaX:e,deltaY:f,distance:p.getDistance(c.center,a.center),angle:p.getAngle(c.center,a.center),direction:p.getDirection(c.center,a.center),scale:p.getScale(c.touches,a.touches),rotation:p.getRotation(c.touches,a.touches)}),a},register:function(a){var c=a.defaults||{};return c[a.name]===b&&(c[a.name]=!0),p.extend(e.defaults,c,!0),a.index=a.index||1e3,this.gestures.push(a),this.gestures.sort(function(a,b){return a.index<b.index?-1:a.index>b.index?1:0}),this.gestures}};e.gestures.Drag={name:"drag",index:50,defaults:{drag_min_distance:10,correct_for_drag_min_distance:!0,drag_max_touches:1,drag_block_horizontal:!1,drag_block_vertical:!1,drag_lock_to_axis:!1,drag_lock_min_distance:25},triggered:!1,handler:function(a,b){var c=v.current;if(c.name!=this.name&&this.triggered)return b.trigger(this.name+"end",a),void(this.triggered=!1);if(!(b.options.drag_max_touches>0&&a.touches.length>b.options.drag_max_touches))switch(a.eventType){case m:this.triggered=!1;break;case n:if(a.distance<b.options.drag_min_distance&&c.name!=this.name)return;var d=c.startEvent.center;if(c.name!=this.name&&(c.name=this.name,b.options.correct_for_drag_min_distance&&a.distance>0)){var e=Math.abs(b.options.drag_min_distance/a.distance);d.pageX+=a.deltaX*e,d.pageY+=a.deltaY*e,d.clientX+=a.deltaX*e,d.clientY+=a.deltaY*e,a=v.extendEventData(a)}(c.lastEvent.drag_locked_to_axis||b.options.drag_lock_to_axis&&b.options.drag_lock_min_distance<=a.distance)&&(a.drag_locked_to_axis=!0);var j=c.lastEvent.direction;a.drag_locked_to_axis&&j!==a.direction&&(a.direction=p.isVertical(j)?a.deltaY<0?h:f:a.deltaX<0?g:i),this.triggered||(b.trigger(this.name+"start",a),this.triggered=!0),b.trigger(this.name,a),b.trigger(this.name+a.direction,a);var k=p.isVertical(a.direction);(b.options.drag_block_vertical&&k||b.options.drag_block_horizontal&&!k)&&a.preventDefault();break;case o:this.triggered&&b.trigger(this.name+"end",a),this.triggered=!1}}},e.gestures.Hold={name:"hold",index:10,defaults:{hold_timeout:500,hold_threshold:2},timer:null,handler:function(a,b){switch(a.eventType){case m:clearTimeout(this.timer),v.current.name=this.name,this.timer=setTimeout(function(){"hold"==v.current.name&&b.trigger("hold",a)},b.options.hold_timeout);break;case n:a.distance>b.options.hold_threshold&&clearTimeout(this.timer);break;case o:clearTimeout(this.timer)}}},e.gestures.Release={name:"release",index:1/0,handler:function(a,b){a.eventType==o&&b.trigger(this.name,a)}},e.gestures.Swipe={name:"swipe",index:40,defaults:{swipe_min_touches:1,swipe_max_touches:1,swipe_velocity:.7},handler:function(a,b){if(a.eventType==o){if(a.touches.length<b.options.swipe_min_touches||a.touches.length>b.options.swipe_max_touches)return;(a.velocityX>b.options.swipe_velocity||a.velocityY>b.options.swipe_velocity)&&(b.trigger(this.name,a),b.trigger(this.name+a.direction,a))}}},e.gestures.Tap={name:"tap",index:100,defaults:{tap_max_touchtime:250,tap_max_distance:10,tap_always:!0,doubletap_distance:20,doubletap_interval:300},has_moved:!1,handler:function(a,b){var c,d,e;a.eventType==m?this.has_moved=!1:a.eventType!=n||this.moved?a.eventType==o&&"touchcancel"!=a.srcEvent.type&&a.deltaTime<b.options.tap_max_touchtime&&!this.has_moved&&(c=v.previous,d=c&&c.lastEvent&&a.timeStamp-c.lastEvent.timeStamp,e=!1,c&&"tap"==c.name&&d&&d<b.options.doubletap_interval&&a.distance<b.options.doubletap_distance&&(b.trigger("doubletap",a),e=!0),(!e||b.options.tap_always)&&(v.current.name="tap",b.trigger(v.current.name,a))):this.has_moved=a.distance>b.options.tap_max_distance}},e.gestures.Touch={name:"touch",index:-1/0,defaults:{prevent_default:!1,prevent_mouseevents:!1},handler:function(a,b){return b.options.prevent_mouseevents&&a.pointerType==j?void a.stopDetect():(b.options.prevent_default&&a.preventDefault(),void(a.eventType==m&&b.trigger(this.name,a)))}},e.gestures.Transform={name:"transform",index:45,defaults:{transform_min_scale:.01,transform_min_rotation:1,transform_always_block:!1,transform_within_instance:!1},triggered:!1,handler:function(a,b){if(v.current.name!=this.name&&this.triggered)return b.trigger(this.name+"end",a),void(this.triggered=!1);if(!(a.touches.length<2)){if(b.options.transform_always_block&&a.preventDefault(),b.options.transform_within_instance)for(var c=-1;a.touches[++c];)if(!p.hasParent(a.touches[c].target,b.element))return;switch(a.eventType){case m:this.triggered=!1;break;case n:var d=Math.abs(1-a.scale),e=Math.abs(a.rotation);if(d<b.options.transform_min_scale&&e<b.options.transform_min_rotation)return;v.current.name=this.name,this.triggered||(b.trigger(this.name+"start",a),this.triggered=!0),b.trigger(this.name,a),e>b.options.transform_min_rotation&&b.trigger("rotate",a),d>b.options.transform_min_scale&&(b.trigger("pinch",a),b.trigger("pinch"+(a.scale<1?"in":"out"),a));break;case o:this.triggered&&b.trigger(this.name+"end",a),this.triggered=!1}}}},a.Hammer=e,"object"==typeof module&&module.exports&&(module.exports=e),"function"==typeof define&&define.amd?define(["jquery"],function(b){return d(a.Hammer,b)}):d(a.Hammer,a.jQuery||a.Zepto)}(window);

/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 * Version: 3.1.11
 * Requires: jQuery 1.2.2+*/
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a:a(jQuery)}(function(a){function b(b){var g=b||window.event,h=i.call(arguments,1),j=0,l=0,m=0,n=0,o=0,p=0;if(b=a.event.fix(g),b.type="mousewheel","detail"in g&&(m=-1*g.detail),"wheelDelta"in g&&(m=g.wheelDelta),"wheelDeltaY"in g&&(m=g.wheelDeltaY),"wheelDeltaX"in g&&(l=-1*g.wheelDeltaX),"axis"in g&&g.axis===g.HORIZONTAL_AXIS&&(l=-1*m,m=0),j=0===m?l:m,"deltaY"in g&&(m=-1*g.deltaY,j=m),"deltaX"in g&&(l=g.deltaX,0===m&&(j=-1*l)),0!==m||0!==l){if(1===g.deltaMode){var q=a.data(this,"mousewheel-line-height");j*=q,m*=q,l*=q}else if(2===g.deltaMode){var r=a.data(this,"mousewheel-page-height");j*=r,m*=r,l*=r}if(n=Math.max(Math.abs(m),Math.abs(l)),(!f||f>n)&&(f=n,d(g,n)&&(f/=40)),d(g,n)&&(j/=40,l/=40,m/=40),j=Math[j>=1?"floor":"ceil"](j/f),l=Math[l>=1?"floor":"ceil"](l/f),m=Math[m>=1?"floor":"ceil"](m/f),k.settings.normalizeOffset&&this.getBoundingClientRect){var s=this.getBoundingClientRect();o=b.clientX-s.left,p=b.clientY-s.top}return b.deltaX=l,b.deltaY=m,b.deltaFactor=f,b.offsetX=o,b.offsetY=p,b.deltaMode=0,h.unshift(b,j,l,m),e&&clearTimeout(e),e=setTimeout(c,200),(a.event.dispatch||a.event.handle).apply(this,h)}}function c(){f=null}function d(a,b){return k.settings.adjustOldDeltas&&"mousewheel"===a.type&&b%120===0}var e,f,g=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],h="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],i=Array.prototype.slice;if(a.event.fixHooks)for(var j=g.length;j;)a.event.fixHooks[g[--j]]=a.event.mouseHooks;var k=a.event.special.mousewheel={version:"3.1.11",setup:function(){if(this.addEventListener)for(var c=h.length;c;)this.addEventListener(h[--c],b,!1);else this.onmousewheel=b;a.data(this,"mousewheel-line-height",k.getLineHeight(this)),a.data(this,"mousewheel-page-height",k.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var c=h.length;c;)this.removeEventListener(h[--c],b,!1);else this.onmousewheel=null;a.removeData(this,"mousewheel-line-height"),a.removeData(this,"mousewheel-page-height")},getLineHeight:function(b){var c=a(b)["offsetParent"in a.fn?"offsetParent":"parent"]();return c.length||(c=a("body")),parseInt(c.css("fontSize"),10)},getPageHeight:function(b){return a(b).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})});
