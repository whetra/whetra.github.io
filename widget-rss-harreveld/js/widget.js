/*
 *	jQuery dotdotdot 1.8.3
 *
 *	Copyright (c) Fred Heusschen
 *	www.frebsite.nl
 *
 *	Plugin website:
 *	dotdotdot.frebsite.nl
 *
 *	Licensed under the MIT license.
 *	http://en.wikipedia.org/wiki/MIT_License
 */

(function( $, undef )
{
	if ( $.fn.dotdotdot )
	{
		return;
	}

	$.fn.dotdotdot = function( o )
	{
		if ( this.length == 0 )
		{
			$.fn.dotdotdot.debug( 'No element found for "' + this.selector + '".' );
			return this;
		}
		if ( this.length > 1 )
		{
			return this.each(
				function()
				{
					$(this).dotdotdot( o );
				}
			);
		}


		var $dot = this;
		var orgContent	= $dot.contents();

		if ( $dot.data( 'dotdotdot' ) )
		{
			$dot.trigger( 'destroy.dot' );
		}

		$dot.data( 'dotdotdot-style', $dot.attr( 'style' ) || '' );
		$dot.css( 'word-wrap', 'break-word' );
		if ($dot.css( 'white-space' ) === 'nowrap')
		{
			$dot.css( 'white-space', 'normal' );
		}

		$dot.bind_events = function()
		{
			$dot.bind(
				'update.dot',
				function( e, c )
				{
					$dot.removeClass("is-truncated");
					e.preventDefault();
					e.stopPropagation();

					switch( typeof opts.height )
					{
						case 'number':
							opts.maxHeight = opts.height;
							break;

						case 'function':
							opts.maxHeight = opts.height.call( $dot[ 0 ] );
							break;

						default:
							opts.maxHeight = getTrueInnerHeight( $dot );
							break;
					}

					opts.maxHeight += opts.tolerance;

					if ( typeof c != 'undefined' )
					{
						if ( typeof c == 'string' || ('nodeType' in c && c.nodeType === 1) )
						{
					 		c = $('<div />').append( c ).contents();
						}
						if ( c instanceof $ )
						{
							orgContent = c;
						}
					}

					$inr = $dot.wrapInner( '<div class="dotdotdot" />' ).children();
					$inr.contents()
						.detach()
						.end()
						.append( orgContent.clone( true ) )
						.find( 'br' )
						.replaceWith( '  <br />  ' )
						.end()
						.css({
							'height'	: 'auto',
							'width'		: 'auto',
							'border'	: 'none',
							'padding'	: 0,
							'margin'	: 0
						});

					var after = false,
						trunc = false;

					if ( conf.afterElement )
					{
						after = conf.afterElement.clone( true );
					    after.show();
						conf.afterElement.detach();
					}

					if ( test( $inr, opts ) )
					{
						if ( opts.wrap == 'children' )
						{
							trunc = children( $inr, opts, after );
						}
						else
						{
							trunc = ellipsis( $inr, $dot, $inr, opts, after );
						}
					}
					$inr.replaceWith( $inr.contents() );
					$inr = null;

					if ( $.isFunction( opts.callback ) )
					{
						opts.callback.call( $dot[ 0 ], trunc, orgContent );
					}

					conf.isTruncated = trunc;
					return trunc;
				}

			).bind(
				'isTruncated.dot',
				function( e, fn )
				{
					e.preventDefault();
					e.stopPropagation();

					if ( typeof fn == 'function' )
					{
						fn.call( $dot[ 0 ], conf.isTruncated );
					}
					return conf.isTruncated;
				}

			).bind(
				'originalContent.dot',
				function( e, fn )
				{
					e.preventDefault();
					e.stopPropagation();

					if ( typeof fn == 'function' )
					{
						fn.call( $dot[ 0 ], orgContent );
					}
					return orgContent;
				}

			).bind(
				'destroy.dot',
				function( e )
				{
					e.preventDefault();
					e.stopPropagation();

					$dot.unwatch()
						.unbind_events()
						.contents()
						.detach()
						.end()
						.append( orgContent )
						.attr( 'style', $dot.data( 'dotdotdot-style' ) || '' )
						.removeClass( 'is-truncated' )
						.data( 'dotdotdot', false );
				}
			);
			return $dot;
		};	//	/bind_events

		$dot.unbind_events = function()
		{
			$dot.unbind('.dot');
			return $dot;
		};	//	/unbind_events

		$dot.watch = function()
		{
			$dot.unwatch();
			if ( opts.watch == 'window' )
			{
				var $window = $(window),
					_wWidth = $window.width(),
					_wHeight = $window.height();

				$window.bind(
					'resize.dot' + conf.dotId,
					function()
					{
						if ( _wWidth != $window.width() || _wHeight != $window.height() || !opts.windowResizeFix )
						{
							_wWidth = $window.width();
							_wHeight = $window.height();

							if ( watchInt )
							{
								clearInterval( watchInt );
							}
							watchInt = setTimeout(
								function()
								{
									$dot.trigger( 'update.dot' );
								}, 100
							);
						}
					}
				);
			}
			else
			{
				watchOrg = getSizes( $dot );
				watchInt = setInterval(
					function()
					{
						if ( $dot.is( ':visible' ) )
						{
							var watchNew = getSizes( $dot );
							if ( watchOrg.width  != watchNew.width ||
								 watchOrg.height != watchNew.height )
							{
								$dot.trigger( 'update.dot' );
								watchOrg = watchNew;
							}
						}
					}, 500
				);
			}
			return $dot;
		};
		$dot.unwatch = function()
		{
			$(window).unbind( 'resize.dot' + conf.dotId );
			if ( watchInt )
			{
				clearInterval( watchInt );
			}
			return $dot;
		};

		var	opts 		= $.extend( true, {}, $.fn.dotdotdot.defaults, o ),
			conf		= {},
			watchOrg	= {},
			watchInt	= null,
			$inr		= null;


		if ( !( opts.lastCharacter.remove instanceof Array ) )
		{
			opts.lastCharacter.remove = $.fn.dotdotdot.defaultArrays.lastCharacter.remove;
		}
		if ( !( opts.lastCharacter.noEllipsis instanceof Array ) )
		{
			opts.lastCharacter.noEllipsis = $.fn.dotdotdot.defaultArrays.lastCharacter.noEllipsis;
		}


		conf.afterElement	= getElement( opts.after, $dot );
		conf.isTruncated	= false;
		conf.dotId			= dotId++;


		$dot.data( 'dotdotdot', true )
			.bind_events()
			.trigger( 'update.dot' );

		if ( opts.watch )
		{
			$dot.watch();
		}

		return $dot;
	};


	//	public
	$.fn.dotdotdot.defaults = {
		'ellipsis'			: '... ',
		'wrap'				: 'word',
		'fallbackToLetter'	: true,
		'lastCharacter'		: {},
		'tolerance'			: 0,
		'callback'			: null,
		'after'				: null,
		'height'			: null,
		'watch'				: false,
		'windowResizeFix'	: true
	};
	$.fn.dotdotdot.defaultArrays = {
		'lastCharacter'		: {
			'remove'			: [ ' ', '\u3000', ',', ';', '.', '!', '?' ],
			'noEllipsis'		: []
		}
	};
	$.fn.dotdotdot.debug = function( msg ) {};


	//	private
	var dotId = 1;

	function children( $elem, o, after )
	{
		var $elements 	= $elem.children(),
			isTruncated	= false;

		$elem.empty();

		for ( var a = 0, l = $elements.length; a < l; a++ )
		{
			var $e = $elements.eq( a );
			$elem.append( $e );
			if ( after )
			{
				$elem.append( after );
			}
			if ( test( $elem, o ) )
			{
				$e.remove();
				isTruncated = true;
				break;
			}
			else
			{
				if ( after )
				{
					after.detach();
				}
			}
		}
		return isTruncated;
	}
	function ellipsis( $elem, $d, $i, o, after )
	{
		var isTruncated	= false;

		//	Don't put the ellipsis directly inside these elements
		var notx = 'a, table, thead, tbody, tfoot, tr, col, colgroup, object, embed, param, ol, ul, dl, blockquote, select, optgroup, option, textarea, script, style';

		//	Don't remove these elements even if they are after the ellipsis
		var noty = 'script, .dotdotdot-keep';

		$elem
			.contents()
			.detach()
			.each(
				function()
				{

					var e	= this,
						$e	= $(e);

					if ( typeof e == 'undefined' )
					{
						return true;
					}
					else if ( $e.is( noty ) )
					{
						$elem.append( $e );
					}
					else if ( isTruncated )
					{
						return true;
					}
					else
					{
						$elem.append( $e );
						if ( after && !$e.is( o.after ) && !$e.find( o.after ).length  )
						{
							$elem[ $elem.is( notx ) ? 'after' : 'append' ]( after );
						}
						if ( test( $i, o ) )
						{
							if ( e.nodeType == 3 ) // node is TEXT
							{
								isTruncated = ellipsisElement( $e, $d, $i, o, after );
							}
							else
							{
								isTruncated = ellipsis( $e, $d, $i, o, after );
							}
						}

						if ( !isTruncated )
						{
							if ( after )
							{
								after.detach();
							}
						}
					}
				}
			);
		$d.addClass("is-truncated");
		return isTruncated;
	}
	function ellipsisElement( $e, $d, $i, o, after )
	{
		var e = $e[ 0 ];

		if ( !e )
		{
			return false;
		}

		var txt			= getTextContent( e ),
			space		= ( txt.indexOf(' ') !== -1 ) ? ' ' : '\u3000',
			separator	= ( o.wrap == 'letter' ) ? '' : space,
			textArr		= txt.split( separator ),
			position 	= -1,
			midPos		= -1,
			startPos	= 0,
			endPos		= textArr.length - 1;


		//	Only one word
		if ( o.fallbackToLetter && startPos == 0 && endPos == 0 )
		{
			separator	= '';
			textArr		= txt.split( separator );
			endPos		= textArr.length - 1;
		}

		while ( startPos <= endPos && !( startPos == 0 && endPos == 0 ) )
		{
			var m = Math.floor( ( startPos + endPos ) / 2 );
			if ( m == midPos )
			{
				break;
			}
			midPos = m;

			setTextContent( e, textArr.slice( 0, midPos + 1 ).join( separator ) + o.ellipsis );
			$i.children()
				.each(
					function()
					{
						$(this).toggle().toggle();
					}
				);

			if ( !test( $i, o ) )
			{
				position = midPos;
				startPos = midPos;
			}
			else
			{
				endPos = midPos;

				//	Fallback to letter
				if (o.fallbackToLetter && startPos == 0 && endPos == 0 )
				{
					separator	= '';
					textArr		= textArr[ 0 ].split( separator );
					position	= -1;
					midPos		= -1;
					startPos	= 0;
					endPos		= textArr.length - 1;
				}
			}
		}

		if ( position != -1 && !( textArr.length == 1 && textArr[ 0 ].length == 0 ) )
		{
			txt = addEllipsis( textArr.slice( 0, position + 1 ).join( separator ), o );
			setTextContent( e, txt );
		}
		else
		{
			var $w = $e.parent();
			$e.detach();

			var afterLength = ( after && after.closest($w).length ) ? after.length : 0;

			if ( $w.contents().length > afterLength )
			{
				e = findLastTextNode( $w.contents().eq( -1 - afterLength ), $d );
			}
			else
			{
				e = findLastTextNode( $w, $d, true );
				if ( !afterLength )
				{
					$w.detach();
				}
			}
			if ( e )
			{
				txt = addEllipsis( getTextContent( e ), o );
				setTextContent( e, txt );
				if ( afterLength && after )
				{
					var $parent = after.parent();

					$(e).parent().append( after );

					if ( !$.trim( $parent.html() ) )
					{
						$parent.remove();
					}
				}
			}
		}

		return true;
	}
	function test( $i, o )
	{
		return $i.innerHeight() > o.maxHeight;
	}
	function addEllipsis( txt, o )
	{
		while( $.inArray( txt.slice( -1 ), o.lastCharacter.remove ) > -1 )
		{
			txt = txt.slice( 0, -1 );
		}
		if ( $.inArray( txt.slice( -1 ), o.lastCharacter.noEllipsis ) < 0 )
		{
			txt += o.ellipsis;
		}
		return txt;
	}
	function getSizes( $d )
	{
		return {
			'width'	: $d.innerWidth(),
			'height': $d.innerHeight()
		};
	}
	function setTextContent( e, content )
	{
		if ( e.innerText )
		{
			e.innerText = content;
		}
		else if ( e.nodeValue )
		{
			e.nodeValue = content;
		}
		else if (e.textContent)
		{
			e.textContent = content;
		}

	}
	function getTextContent( e )
	{
		if ( e.innerText )
		{
			return e.innerText;
		}
		else if ( e.nodeValue )
		{
			return e.nodeValue;
		}
		else if ( e.textContent )
		{
			return e.textContent;
		}
		else
		{
			return "";
		}
	}
	function getPrevNode( n )
	{
		do
		{
			n = n.previousSibling;
		}
		while ( n && n.nodeType !== 1 && n.nodeType !== 3 );

		return n;
	}
	function findLastTextNode( $el, $top, excludeCurrent )
	{
		var e = $el && $el[ 0 ], p;
		if ( e )
		{
			if ( !excludeCurrent )
			{
				if ( e.nodeType === 3 )
				{
					return e;
				}
				if ( $.trim( $el.text() ) )
				{
					return findLastTextNode( $el.contents().last(), $top );
				}
			}
			p = getPrevNode( e );
			while ( !p )
			{
				$el = $el.parent();
				if ( $el.is( $top ) || !$el.length )
				{
					return false;
				}
				p = getPrevNode( $el[0] );
			}
			if ( p )
			{
				return findLastTextNode( $(p), $top );
			}
		}
		return false;
	}
	function getElement( e, $i )
	{
		if ( !e )
		{
			return false;
		}
		if ( typeof e === 'string' )
		{
			e = $(e, $i);
			return ( e.length )
				? e
				: false;
		}
		return !e.jquery
			? false
			: e;
	}
	function getTrueInnerHeight( $el )
	{
		var h = $el.innerHeight(),
			a = [ 'paddingTop', 'paddingBottom' ];

		for ( var z = 0, l = a.length; z < l; z++ )
		{
			var m = parseInt( $el.css( a[ z ] ), 10 );
			if ( isNaN( m ) )
			{
				m = 0;
			}
			h -= m;
		}
		return h;
	}


	//	override jQuery.html
	var _orgHtml = $.fn.html;
	$.fn.html = function( str )
	{
		if ( str != undef && !$.isFunction( str ) && this.data( 'dotdotdot' ) )
		{
			return this.trigger( 'update', [ str ] );
		}
		return _orgHtml.apply( this, arguments );
	};


	//	override jQuery.text
	var _orgText = $.fn.text;
	$.fn.text = function( str )
	{
		if ( str != undef && !$.isFunction( str ) && this.data( 'dotdotdot' ) )
		{
			str = $( '<div />' ).text( str ).html();
			return this.trigger( 'update', [ str ] );
		}
		return _orgText.apply( this, arguments );
	};


})( jQuery );

/*

## Automatic parsing for CSS classes
Contributed by [Ramil Valitov](https://github.com/rvalitov)

### The idea
You can add one or several CSS classes to HTML elements to automatically invoke "jQuery.dotdotdot functionality" and some extra features. It allows to use jQuery.dotdotdot only by adding appropriate CSS classes without JS programming.

### Available classes and their description
* dot-ellipsis - automatically invoke jQuery.dotdotdot to this element. This class must be included if you plan to use other classes below.
* dot-resize-update - automatically update if window resize event occurs. It's equivalent to option `watch:'window'`.
* dot-timer-update - automatically update if window resize event occurs. It's equivalent to option `watch:true`.
* dot-load-update - automatically update after the window has beem completely rendered. Can be useful if your content is generated dynamically using using JS and, hence, jQuery.dotdotdot can't correctly detect the height of the element before it's rendered completely.
* dot-height-XXX - available height of content area in pixels, where XXX is a number, e.g. can be `dot-height-35` if you want to set maximum height for 35 pixels. It's equivalent to option `height:'XXX'`.

### Usage examples
*Adding jQuery.dotdotdot to element*
    
	<div class="dot-ellipsis">
	<p>Lorem Ipsum is simply dummy text.</p>
	</div>
	
*Adding jQuery.dotdotdot to element with update on window resize*
    
	<div class="dot-ellipsis dot-resize-update">
	<p>Lorem Ipsum is simply dummy text.</p>
	</div>
	
*Adding jQuery.dotdotdot to element with predefined height of 50px*
    
	<div class="dot-ellipsis dot-height-50">
	<p>Lorem Ipsum is simply dummy text.</p>
	</div>
	
*/

jQuery(document).ready(function($) {
	//We only invoke jQuery.dotdotdot on elements that have dot-ellipsis class
	$(".dot-ellipsis").each(function(){
		//Checking if update on window resize required
		var watch_window=$(this).hasClass("dot-resize-update");
		
		//Checking if update on timer required
		var watch_timer=$(this).hasClass("dot-timer-update");
		
		//Checking if height set
		var height=0;		
		var classList = $(this).attr('class').split(/\s+/);
		$.each(classList, function(index, item) {
			var matchResult = item.match(/^dot-height-(\d+)$/);
			if(matchResult !== null)
				height = Number(matchResult[1]);
		});
		
		//Invoking jQuery.dotdotdot
		var x = new Object();
		if (watch_timer)
			x.watch=true;
		if (watch_window)
			x.watch='window';
		if (height>0)
			x.height=height;
		$(this).dotdotdot(x);
	});
		
});

//Updating elements (if any) on window.load event
jQuery(window).on('load', function(){
	jQuery(".dot-ellipsis.dot-load-update").trigger("update.dot");
});

/* Web Font Loader v1.6.28 - (c) Adobe Systems, Google. License: Apache 2.0 */(function(){function aa(a,b,c){return a.call.apply(a.bind,arguments)}function ba(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function p(a,b,c){p=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?aa:ba;return p.apply(null,arguments)}var q=Date.now||function(){return+new Date};function ca(a,b){this.a=a;this.o=b||a;this.c=this.o.document}var da=!!window.FontFace;function t(a,b,c,d){b=a.c.createElement(b);if(c)for(var e in c)c.hasOwnProperty(e)&&("style"==e?b.style.cssText=c[e]:b.setAttribute(e,c[e]));d&&b.appendChild(a.c.createTextNode(d));return b}function u(a,b,c){a=a.c.getElementsByTagName(b)[0];a||(a=document.documentElement);a.insertBefore(c,a.lastChild)}function v(a){a.parentNode&&a.parentNode.removeChild(a)}
function w(a,b,c){b=b||[];c=c||[];for(var d=a.className.split(/\s+/),e=0;e<b.length;e+=1){for(var f=!1,g=0;g<d.length;g+=1)if(b[e]===d[g]){f=!0;break}f||d.push(b[e])}b=[];for(e=0;e<d.length;e+=1){f=!1;for(g=0;g<c.length;g+=1)if(d[e]===c[g]){f=!0;break}f||b.push(d[e])}a.className=b.join(" ").replace(/\s+/g," ").replace(/^\s+|\s+$/,"")}function y(a,b){for(var c=a.className.split(/\s+/),d=0,e=c.length;d<e;d++)if(c[d]==b)return!0;return!1}
function ea(a){return a.o.location.hostname||a.a.location.hostname}function z(a,b,c){function d(){m&&e&&f&&(m(g),m=null)}b=t(a,"link",{rel:"stylesheet",href:b,media:"all"});var e=!1,f=!0,g=null,m=c||null;da?(b.onload=function(){e=!0;d()},b.onerror=function(){e=!0;g=Error("Stylesheet failed to load");d()}):setTimeout(function(){e=!0;d()},0);u(a,"head",b)}
function A(a,b,c,d){var e=a.c.getElementsByTagName("head")[0];if(e){var f=t(a,"script",{src:b}),g=!1;f.onload=f.onreadystatechange=function(){g||this.readyState&&"loaded"!=this.readyState&&"complete"!=this.readyState||(g=!0,c&&c(null),f.onload=f.onreadystatechange=null,"HEAD"==f.parentNode.tagName&&e.removeChild(f))};e.appendChild(f);setTimeout(function(){g||(g=!0,c&&c(Error("Script load timeout")))},d||5E3);return f}return null};function B(){this.a=0;this.c=null}function C(a){a.a++;return function(){a.a--;D(a)}}function E(a,b){a.c=b;D(a)}function D(a){0==a.a&&a.c&&(a.c(),a.c=null)};function F(a){this.a=a||"-"}F.prototype.c=function(a){for(var b=[],c=0;c<arguments.length;c++)b.push(arguments[c].replace(/[\W_]+/g,"").toLowerCase());return b.join(this.a)};function G(a,b){this.c=a;this.f=4;this.a="n";var c=(b||"n4").match(/^([nio])([1-9])$/i);c&&(this.a=c[1],this.f=parseInt(c[2],10))}function fa(a){return H(a)+" "+(a.f+"00")+" 300px "+I(a.c)}function I(a){var b=[];a=a.split(/,\s*/);for(var c=0;c<a.length;c++){var d=a[c].replace(/['"]/g,"");-1!=d.indexOf(" ")||/^\d/.test(d)?b.push("'"+d+"'"):b.push(d)}return b.join(",")}function J(a){return a.a+a.f}function H(a){var b="normal";"o"===a.a?b="oblique":"i"===a.a&&(b="italic");return b}
function ga(a){var b=4,c="n",d=null;a&&((d=a.match(/(normal|oblique|italic)/i))&&d[1]&&(c=d[1].substr(0,1).toLowerCase()),(d=a.match(/([1-9]00|normal|bold)/i))&&d[1]&&(/bold/i.test(d[1])?b=7:/[1-9]00/.test(d[1])&&(b=parseInt(d[1].substr(0,1),10))));return c+b};function ha(a,b){this.c=a;this.f=a.o.document.documentElement;this.h=b;this.a=new F("-");this.j=!1!==b.events;this.g=!1!==b.classes}function ia(a){a.g&&w(a.f,[a.a.c("wf","loading")]);K(a,"loading")}function L(a){if(a.g){var b=y(a.f,a.a.c("wf","active")),c=[],d=[a.a.c("wf","loading")];b||c.push(a.a.c("wf","inactive"));w(a.f,c,d)}K(a,"inactive")}function K(a,b,c){if(a.j&&a.h[b])if(c)a.h[b](c.c,J(c));else a.h[b]()};function ja(){this.c={}}function ka(a,b,c){var d=[],e;for(e in b)if(b.hasOwnProperty(e)){var f=a.c[e];f&&d.push(f(b[e],c))}return d};function M(a,b){this.c=a;this.f=b;this.a=t(this.c,"span",{"aria-hidden":"true"},this.f)}function N(a){u(a.c,"body",a.a)}function O(a){return"display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:"+I(a.c)+";"+("font-style:"+H(a)+";font-weight:"+(a.f+"00")+";")};function P(a,b,c,d,e,f){this.g=a;this.j=b;this.a=d;this.c=c;this.f=e||3E3;this.h=f||void 0}P.prototype.start=function(){var a=this.c.o.document,b=this,c=q(),d=new Promise(function(d,e){function f(){q()-c>=b.f?e():a.fonts.load(fa(b.a),b.h).then(function(a){1<=a.length?d():setTimeout(f,25)},function(){e()})}f()}),e=null,f=new Promise(function(a,d){e=setTimeout(d,b.f)});Promise.race([f,d]).then(function(){e&&(clearTimeout(e),e=null);b.g(b.a)},function(){b.j(b.a)})};function Q(a,b,c,d,e,f,g){this.v=a;this.B=b;this.c=c;this.a=d;this.s=g||"BESbswy";this.f={};this.w=e||3E3;this.u=f||null;this.m=this.j=this.h=this.g=null;this.g=new M(this.c,this.s);this.h=new M(this.c,this.s);this.j=new M(this.c,this.s);this.m=new M(this.c,this.s);a=new G(this.a.c+",serif",J(this.a));a=O(a);this.g.a.style.cssText=a;a=new G(this.a.c+",sans-serif",J(this.a));a=O(a);this.h.a.style.cssText=a;a=new G("serif",J(this.a));a=O(a);this.j.a.style.cssText=a;a=new G("sans-serif",J(this.a));a=
O(a);this.m.a.style.cssText=a;N(this.g);N(this.h);N(this.j);N(this.m)}var R={D:"serif",C:"sans-serif"},S=null;function T(){if(null===S){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);S=!!a&&(536>parseInt(a[1],10)||536===parseInt(a[1],10)&&11>=parseInt(a[2],10))}return S}Q.prototype.start=function(){this.f.serif=this.j.a.offsetWidth;this.f["sans-serif"]=this.m.a.offsetWidth;this.A=q();U(this)};
function la(a,b,c){for(var d in R)if(R.hasOwnProperty(d)&&b===a.f[R[d]]&&c===a.f[R[d]])return!0;return!1}function U(a){var b=a.g.a.offsetWidth,c=a.h.a.offsetWidth,d;(d=b===a.f.serif&&c===a.f["sans-serif"])||(d=T()&&la(a,b,c));d?q()-a.A>=a.w?T()&&la(a,b,c)&&(null===a.u||a.u.hasOwnProperty(a.a.c))?V(a,a.v):V(a,a.B):ma(a):V(a,a.v)}function ma(a){setTimeout(p(function(){U(this)},a),50)}function V(a,b){setTimeout(p(function(){v(this.g.a);v(this.h.a);v(this.j.a);v(this.m.a);b(this.a)},a),0)};function W(a,b,c){this.c=a;this.a=b;this.f=0;this.m=this.j=!1;this.s=c}var X=null;W.prototype.g=function(a){var b=this.a;b.g&&w(b.f,[b.a.c("wf",a.c,J(a).toString(),"active")],[b.a.c("wf",a.c,J(a).toString(),"loading"),b.a.c("wf",a.c,J(a).toString(),"inactive")]);K(b,"fontactive",a);this.m=!0;na(this)};
W.prototype.h=function(a){var b=this.a;if(b.g){var c=y(b.f,b.a.c("wf",a.c,J(a).toString(),"active")),d=[],e=[b.a.c("wf",a.c,J(a).toString(),"loading")];c||d.push(b.a.c("wf",a.c,J(a).toString(),"inactive"));w(b.f,d,e)}K(b,"fontinactive",a);na(this)};function na(a){0==--a.f&&a.j&&(a.m?(a=a.a,a.g&&w(a.f,[a.a.c("wf","active")],[a.a.c("wf","loading"),a.a.c("wf","inactive")]),K(a,"active")):L(a.a))};function oa(a){this.j=a;this.a=new ja;this.h=0;this.f=this.g=!0}oa.prototype.load=function(a){this.c=new ca(this.j,a.context||this.j);this.g=!1!==a.events;this.f=!1!==a.classes;pa(this,new ha(this.c,a),a)};
function qa(a,b,c,d,e){var f=0==--a.h;(a.f||a.g)&&setTimeout(function(){var a=e||null,m=d||null||{};if(0===c.length&&f)L(b.a);else{b.f+=c.length;f&&(b.j=f);var h,l=[];for(h=0;h<c.length;h++){var k=c[h],n=m[k.c],r=b.a,x=k;r.g&&w(r.f,[r.a.c("wf",x.c,J(x).toString(),"loading")]);K(r,"fontloading",x);r=null;if(null===X)if(window.FontFace){var x=/Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent),xa=/OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent)&&/Apple/.exec(window.navigator.vendor);
X=x?42<parseInt(x[1],10):xa?!1:!0}else X=!1;X?r=new P(p(b.g,b),p(b.h,b),b.c,k,b.s,n):r=new Q(p(b.g,b),p(b.h,b),b.c,k,b.s,a,n);l.push(r)}for(h=0;h<l.length;h++)l[h].start()}},0)}function pa(a,b,c){var d=[],e=c.timeout;ia(b);var d=ka(a.a,c,a.c),f=new W(a.c,b,e);a.h=d.length;b=0;for(c=d.length;b<c;b++)d[b].load(function(b,d,c){qa(a,f,b,d,c)})};function ra(a,b){this.c=a;this.a=b}
ra.prototype.load=function(a){function b(){if(f["__mti_fntLst"+d]){var c=f["__mti_fntLst"+d](),e=[],h;if(c)for(var l=0;l<c.length;l++){var k=c[l].fontfamily;void 0!=c[l].fontStyle&&void 0!=c[l].fontWeight?(h=c[l].fontStyle+c[l].fontWeight,e.push(new G(k,h))):e.push(new G(k))}a(e)}else setTimeout(function(){b()},50)}var c=this,d=c.a.projectId,e=c.a.version;if(d){var f=c.c.o;A(this.c,(c.a.api||"https://fast.fonts.net/jsapi")+"/"+d+".js"+(e?"?v="+e:""),function(e){e?a([]):(f["__MonotypeConfiguration__"+
d]=function(){return c.a},b())}).id="__MonotypeAPIScript__"+d}else a([])};function sa(a,b){this.c=a;this.a=b}sa.prototype.load=function(a){var b,c,d=this.a.urls||[],e=this.a.families||[],f=this.a.testStrings||{},g=new B;b=0;for(c=d.length;b<c;b++)z(this.c,d[b],C(g));var m=[];b=0;for(c=e.length;b<c;b++)if(d=e[b].split(":"),d[1])for(var h=d[1].split(","),l=0;l<h.length;l+=1)m.push(new G(d[0],h[l]));else m.push(new G(d[0]));E(g,function(){a(m,f)})};function ta(a,b){a?this.c=a:this.c=ua;this.a=[];this.f=[];this.g=b||""}var ua="https://fonts.googleapis.com/css";function va(a,b){for(var c=b.length,d=0;d<c;d++){var e=b[d].split(":");3==e.length&&a.f.push(e.pop());var f="";2==e.length&&""!=e[1]&&(f=":");a.a.push(e.join(f))}}
function wa(a){if(0==a.a.length)throw Error("No fonts to load!");if(-1!=a.c.indexOf("kit="))return a.c;for(var b=a.a.length,c=[],d=0;d<b;d++)c.push(a.a[d].replace(/ /g,"+"));b=a.c+"?family="+c.join("%7C");0<a.f.length&&(b+="&subset="+a.f.join(","));0<a.g.length&&(b+="&text="+encodeURIComponent(a.g));return b};function ya(a){this.f=a;this.a=[];this.c={}}
var za={latin:"BESbswy","latin-ext":"\u00e7\u00f6\u00fc\u011f\u015f",cyrillic:"\u0439\u044f\u0416",greek:"\u03b1\u03b2\u03a3",khmer:"\u1780\u1781\u1782",Hanuman:"\u1780\u1781\u1782"},Aa={thin:"1",extralight:"2","extra-light":"2",ultralight:"2","ultra-light":"2",light:"3",regular:"4",book:"4",medium:"5","semi-bold":"6",semibold:"6","demi-bold":"6",demibold:"6",bold:"7","extra-bold":"8",extrabold:"8","ultra-bold":"8",ultrabold:"8",black:"9",heavy:"9",l:"3",r:"4",b:"7"},Ba={i:"i",italic:"i",n:"n",normal:"n"},
Ca=/^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
function Da(a){for(var b=a.f.length,c=0;c<b;c++){var d=a.f[c].split(":"),e=d[0].replace(/\+/g," "),f=["n4"];if(2<=d.length){var g;var m=d[1];g=[];if(m)for(var m=m.split(","),h=m.length,l=0;l<h;l++){var k;k=m[l];if(k.match(/^[\w-]+$/)){var n=Ca.exec(k.toLowerCase());if(null==n)k="";else{k=n[2];k=null==k||""==k?"n":Ba[k];n=n[1];if(null==n||""==n)n="4";else var r=Aa[n],n=r?r:isNaN(n)?"4":n.substr(0,1);k=[k,n].join("")}}else k="";k&&g.push(k)}0<g.length&&(f=g);3==d.length&&(d=d[2],g=[],d=d?d.split(","):
g,0<d.length&&(d=za[d[0]])&&(a.c[e]=d))}a.c[e]||(d=za[e])&&(a.c[e]=d);for(d=0;d<f.length;d+=1)a.a.push(new G(e,f[d]))}};function Ea(a,b){this.c=a;this.a=b}var Fa={Arimo:!0,Cousine:!0,Tinos:!0};Ea.prototype.load=function(a){var b=new B,c=this.c,d=new ta(this.a.api,this.a.text),e=this.a.families;va(d,e);var f=new ya(e);Da(f);z(c,wa(d),C(b));E(b,function(){a(f.a,f.c,Fa)})};function Ga(a,b){this.c=a;this.a=b}Ga.prototype.load=function(a){var b=this.a.id,c=this.c.o;b?A(this.c,(this.a.api||"https://use.typekit.net")+"/"+b+".js",function(b){if(b)a([]);else if(c.Typekit&&c.Typekit.config&&c.Typekit.config.fn){b=c.Typekit.config.fn;for(var e=[],f=0;f<b.length;f+=2)for(var g=b[f],m=b[f+1],h=0;h<m.length;h++)e.push(new G(g,m[h]));try{c.Typekit.load({events:!1,classes:!1,async:!0})}catch(l){}a(e)}},2E3):a([])};function Ha(a,b){this.c=a;this.f=b;this.a=[]}Ha.prototype.load=function(a){var b=this.f.id,c=this.c.o,d=this;b?(c.__webfontfontdeckmodule__||(c.__webfontfontdeckmodule__={}),c.__webfontfontdeckmodule__[b]=function(b,c){for(var g=0,m=c.fonts.length;g<m;++g){var h=c.fonts[g];d.a.push(new G(h.name,ga("font-weight:"+h.weight+";font-style:"+h.style)))}a(d.a)},A(this.c,(this.f.api||"https://f.fontdeck.com/s/css/js/")+ea(this.c)+"/"+b+".js",function(b){b&&a([])})):a([])};var Y=new oa(window);Y.a.c.custom=function(a,b){return new sa(b,a)};Y.a.c.fontdeck=function(a,b){return new Ha(b,a)};Y.a.c.monotype=function(a,b){return new ra(b,a)};Y.a.c.typekit=function(a,b){return new Ga(b,a)};Y.a.c.google=function(a,b){return new Ea(b,a)};var Z={load:p(Y.load,Y)};"function"===typeof define&&define.amd?define(function(){return Z}):"undefined"!==typeof module&&module.exports?module.exports=Z:(window.WebFont=Z,window.WebFontConfig&&Y.load(window.WebFontConfig));}());

/*
 *  Project: Auto-Scroll
 *  Description: Auto-scroll plugin for use with Rise Vision Widgets
 *  Author: @donnapep
 *  License: MIT
 */

;(function ($, window, document, undefined) {
	"use strict";

	var pluginName = "autoScroll",
		defaults = {
			by: "continuous",
			speed: "medium",
			duration: 10,
			pause: 5,
			click: false,
			minimumMovement: 3 // Draggable default value - http://greensock.com/docs/#/HTML5/Drag/Draggable/
		};


	function Plugin(element, options) {
		this.element = element;
		this.page = $(element).find(".page");
		this.options = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.isLoading = true;
		this.draggable = null;
		this.tween = null;
		this.calculateProgress = null;
		this.init();
	}

	Plugin.prototype = {
		init: function () {
			var speed, duration;
			var self = this;
			var scrollComplete = null;
			var pageComplete = null;
			var elementHeight = $(this.element).outerHeight(true);
			var pauseHeight = elementHeight;
			var max = this.element.scrollHeight - this.element.offsetHeight;

			function pauseTween() {
				self.tween.pause();

				TweenLite.killDelayedCallsTo(self.calculateProgress);
				TweenLite.killDelayedCallsTo(scrollComplete);
				// Only used when scrolling by page.
				TweenLite.killDelayedCallsTo(pageComplete);
			}

			this.calculateProgress = function() {
				// Set pauseHeight to new value.
				pauseHeight = $(self.element).scrollTop() +
					elementHeight;

				self.tween.progress($(self.element).scrollTop() / max)
					.play();
			};

			if (this.canScroll()) {
				// Set scroll speed.
				if (this.options.by === "page") {
					if (this.options.speed === "fastest") {
						speed = 0.4;
					}
					else if (this.options.speed === "fast") {
						speed = 0.8;
					}
					else if (this.options.speed === "medium") {
						speed = 1.2;
					}
					else if (this.options.speed === "slow") {
						speed = 1.6;
					}
					else {
						speed = 2;
					}

					duration = this.page.outerHeight(true) /
						$(this.element).outerHeight(true) * speed;
				}
				else {  // Continuous or by row
					if (this.options.speed === "fastest") {
						speed = 60;
					}
					else if (this.options.speed === "fast") {
						speed = 50;
					}
					else if (this.options.speed === "medium") {
						speed = 40;
					}
					else if (this.options.speed === "slow") {
						speed = 30;
					}
					else {
						speed = 20;
					}

					duration = Math.abs((this.page.outerHeight(true) -
						$(this.element).outerHeight(true)) / speed);
				}

				Draggable.create(this.element, {
					type: "scrollTop",
					throwProps: true,
					edgeResistance: 0.75,
					minimumMovement: self.options.minimumMovement,
					onPress: function() {
						pauseTween();
					},
					onRelease: function() {
						if (self.options.by !== "none") {
							/* Figure out what the new scroll position is and
							 translate that into the progress of the tween (0-1)
							 so that we can calibrate it; otherwise, it'd jump
							 back to where it paused when we resume(). */
							TweenLite.delayedCall(self.options.pause, self.calculateProgress);
						}
					},
					onClick: function() {
						if (self.options.click) {
							pauseTween();
							$(self.element).trigger("scrollClick", [this.pointerEvent]);
						}
					}
				});

				this.draggable = Draggable.get(this.element);

				this.tween = TweenLite.to(this.draggable.scrollProxy, duration, {
					scrollTop: max,
					ease: Linear.easeNone,
					delay: (this.options.by === "page") ? this.options.duration : this.options.pause,
					paused: true,
					onUpdate: (this.options.by === "page" ? function() {
						if (Math.abs(self.draggable.scrollProxy.top()) >= pauseHeight) {
							self.tween.pause();

							// Next height at which to pause scrolling.
							pauseHeight += elementHeight;

							TweenLite.delayedCall(self.options.duration,
								pageComplete = function() {
									self.tween.resume();
								}
							);
						}
					} : undefined),
					onComplete: function() {
						TweenLite.delayedCall((self.options.by === "page") ? self.options.duration : self.options.pause,
							scrollComplete = function() {
								TweenLite.to(self.page, 1, {
									autoAlpha: 0,
									onComplete: function() {
										self.tween.seek(0).pause();

										if (self.options.by === "page") {
											pauseHeight = elementHeight;
										}

										$(self.element).trigger("done");
									}
								});
							}
						);
					}
				});

				// Hide scrollbar.
				TweenLite.set(this.element, { overflowY: "hidden" });
			} else {
				if (this.options.click) {
					// Account for content that is to be clicked when content not needed to be scrolled
					// Leverage Draggable for touch/click event handling
					Draggable.create(this.element, {
						type: "scrollTop",
						throwProps: true,
						edgeResistance: 0.95,
						minimumMovement: this.options.minimumMovement,
						onClick: function() {
							$(self.element).trigger("scrollClick", [this.pointerEvent]);
						}
					});

					this.draggable = Draggable.get(this.element);
				}
			}
		},
		// Check if content is larger than viewable area and if the scroll settings is set to actually scroll.
		canScroll: function() {
			return this.options && (this.page.height() > $(this.element).height());
		},
		destroy: function() {
			$(this.element).removeData();
			if (this.tween) {
				this.tween.kill();
			}

			if (this.draggable) {
				this.draggable.kill();
			}

			// Remove elements.
			this.element = null;
			this.page = null;
			this.options = null;
			this._defaults = null;
			this.draggable = null;
			this.tween = null;
			this.calculateProgress = null;
		}
	};

	Plugin.prototype.play = function() {
		if (this.canScroll() && this.options.by !== "none") {
			if (this.tween) {
				if (this.isLoading) {
					this.tween.play();
					this.isLoading = false;
				}
				else {
					TweenLite.to(this.page, 1, {autoAlpha: 1});
					TweenLite.delayedCall((this.options.by === "page") ? this.options.duration : this.options.pause, this.calculateProgress);
				}
			}
		}
	};

	Plugin.prototype.pause = function() {
		if (this.tween) {
			TweenLite.killDelayedCallsTo(this.calculateProgress);
			this.tween.pause();
		}
	};

	Plugin.prototype.stop = function() {
		if (this.tween) {
			TweenLite.killDelayedCallsTo(this.calculateProgress);
			this.tween.kill();
		}

		this.element = null;
		this.page = null;
	};

	// A lightweight plugin wrapper around the constructor that prevents
	// multiple instantiations.
	$.fn.autoScroll = function(options) {
		return this.each(function() {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new Plugin(this, options));
			}
		});
	};
})(jQuery, window, document);

/* exported WIDGET_COMMON_CONFIG */
var WIDGET_COMMON_CONFIG = {
  AUTH_PATH_URL: "v1/widget/auth",
  LOGGER_CLIENT_ID: "1088527147109-6q1o2vtihn34292pjt4ckhmhck0rk0o7.apps.googleusercontent.com",
  LOGGER_CLIENT_SECRET: "nlZyrcPLg6oEwO9f9Wfn29Wh",
  LOGGER_REFRESH_TOKEN: "1/xzt4kwzE1H7W9VnKB8cAaCx6zb4Es4nKEoqaYHdTD15IgOrJDtdun6zK6XiATCKT",
  STORE_URL: "https://store-dot-rvaserver2.appspot.com/"
};
/* global WebFont */

var RiseVision = RiseVision || {};

RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Utilities = (function() {

  function getFontCssStyle(className, fontObj) {
    var family = "font-family: " + decodeURIComponent(fontObj.font.family).replace(/'/g, "") + "; ";
    var color = "color: " + (fontObj.color ? fontObj.color : fontObj.forecolor) + "; ";
    var size = "font-size: " + (fontObj.size.indexOf("px") === -1 ? fontObj.size + "px; " : fontObj.size + "; ");
    var weight = "font-weight: " + (fontObj.bold ? "bold" : "normal") + "; ";
    var italic = "font-style: " + (fontObj.italic ? "italic" : "normal") + "; ";
    var underline = "text-decoration: " + (fontObj.underline ? "underline" : "none") + "; ";
    var highlight = "background-color: " + (fontObj.highlightColor ? fontObj.highlightColor : fontObj.backcolor) + ";";

    return "." + className + " {" + family + color + size + weight + italic + underline + highlight + "}";
  }

  function addCSSRules(rules) {
    var style = document.createElement("style");

    for (var i = 0, length = rules.length; i < length; i++) {
      style.appendChild(document.createTextNode(rules[i]));
    }

    document.head.appendChild(style);
  }

  /*
   * Loads Google or custom fonts, if applicable, and injects CSS styles
   * into the head of the document.
   *
   * @param    array    settings    Array of objects with the following form:
 *                                   [{
 *                                     "class": "date",
 *                                     "fontSetting": {
 *                                         bold: true,
 *                                         color: "black",
 *                                         font: {
 *                                           family: "Akronim",
 *                                           font: "Akronim",
 *                                           name: "Verdana",
 *                                           type: "google",
 *                                           url: "http://custom-font-url"
 *                                         },
 *                                         highlightColor: "transparent",
 *                                         italic: false,
 *                                         size: "20",
 *                                         underline: false
 *                                     }
 *                                   }]
   *
   *           object   contentDoc    Document object into which to inject styles
   *                                  and load fonts (optional).
   */
  function loadFonts(settings, cb) {
    var families = null,
      googleFamilies = [],
      customFamilies = [],
      customUrls = [];

    function callback() {
      if (cb && typeof cb === "function") {
        cb();
      }
    }

    function onGoogleFontsLoaded() {
      callback();
    }

    if (!settings || settings.length === 0) {
      callback();
      return;
    }

    // Check for custom css class names and add rules if so
    settings.forEach(function(item) {
      if (item.class && item.fontStyle) {
        addCSSRules([ getFontCssStyle(item.class, item.fontStyle) ]);
      }
    });

    // Google fonts
    for (var i = 0; i < settings.length; i++) {
      if (settings[i].fontStyle && settings[i].fontStyle.font.type &&
        (settings[i].fontStyle.font.type === "google")) {
        // Remove fallback font.
        families = settings[i].fontStyle.font.family.split(",")[0];

        // strip possible single quotes
        families = families.replace(/'/g, "");

        googleFamilies.push(families);
      }
    }

    // Custom fonts
    for (i = 0; i < settings.length; i++) {
      if (settings[i].fontStyle && settings[i].fontStyle.font.type &&
        (settings[i].fontStyle.font.type === "custom")) {
        // decode value and strip single quotes
        customFamilies.push(decodeURIComponent(settings[i].fontStyle.font.family).replace(/'/g, ""));
        // strip single quotes
        customUrls.push(settings[i].fontStyle.font.url.replace(/'/g, "\\'"));
      }
    }

    if (googleFamilies.length === 0 && customFamilies.length === 0) {
      callback();
    }
    else {
      // Load the fonts
      for (var j = 0; j < customFamilies.length; j += 1) {
        loadCustomFont(customFamilies[j], customUrls[j]);
      }

      if (googleFamilies.length > 0) {
        loadGoogleFonts(googleFamilies, onGoogleFontsLoaded);
      }
      else {
        callback();
      }
    }
  }

  function loadCustomFont(family, url, contentDoc) {
    var sheet = null;
    var rule = "font-family: " + family + "; " + "src: url('" + url + "');";

    contentDoc = contentDoc || document;

    sheet = contentDoc.styleSheets[0];

    if (sheet !== null) {
      sheet.addRule("@font-face", rule);
    }
  }

  function loadGoogleFonts(families, cb) {
    WebFont.load({
      google: {
        families: families
      },
      active: function() {
        if (cb && typeof cb === "function") {
          cb();
        }
      },
      inactive: function() {
        if (cb && typeof cb === "function") {
          cb();
        }
      },
      timeout: 5000
    });
  }

  function loadScript( src ) {
    var script = document.createElement( "script" );

    script.src = src;
    document.body.appendChild( script );
  }

  function preloadImages(urls) {
    var length = urls.length,
      images = [];

    for (var i = 0; i < length; i++) {
      images[i] = new Image();
      images[i].src = urls[i];
    }
  }

  /**
   * Get the current URI query param
   */
  function getQueryParameter(param) {
    return getQueryStringParameter(param, window.location.search.substring(1));
  }

  /**
   * Get the query parameter from a query string
   */
  function getQueryStringParameter(param, query) {
    var vars = query.split("&"),
      pair;

    for (var i = 0; i < vars.length; i++) {
      pair = vars[i].split("=");

      if (pair[0] == param) { // jshint ignore:line
        return decodeURIComponent(pair[1]);
      }
    }

    return "";
  }

  /**
   * Get date object from player version string
   */
  function getDateObjectFromPlayerVersionString(playerVersion) {
    var reggie = /(\d{4})\.(\d{2})\.(\d{2})\.(\d{2})\.(\d{2})/;
    var dateArray = reggie.exec(playerVersion);
    if (dateArray) {
      return new Date(
        (+dateArray[1]),
          (+dateArray[2])-1, // Careful, month starts at 0!
        (+dateArray[3]),
        (+dateArray[4]),
        (+dateArray[5])
      );
    } else {
      return;
    }
  }

  function getRiseCacheErrorMessage(statusCode) {
    var errorMessage = "";
    switch (statusCode) {
      case 404:
        errorMessage = "The file does not exist or cannot be accessed.";
        break;
      case 507:
        errorMessage = "There is not enough disk space to save the file on Rise Cache.";
        break;
      default:
        errorMessage = "There was a problem retrieving the file from Rise Cache.";
    }

    return errorMessage;
  }

  function unescapeHTML(html) {
    var div = document.createElement("div");

    div.innerHTML = html;

    return div.textContent;
  }

  function hasInternetConnection(filePath, callback) {
    var xhr = new XMLHttpRequest();

    if (!filePath || !callback || typeof callback !== "function") {
      return;
    }

    xhr.open("HEAD", filePath + "?cb=" + new Date().getTime(), false);

    try {
      xhr.send();

      callback((xhr.status >= 200 && xhr.status < 304));

    } catch (e) {
      callback(false);
    }
  }

  /**
   * Check if chrome version is under a certain version
   */
  function isLegacy() {
    var legacyVersion = 25;

    var match = navigator.userAgent.match(/Chrome\/(\S+)/);
    var version = match ? match[1] : 0;

    if (version) {
      version = parseInt(version.substring(0,version.indexOf(".")));

      if (version <= legacyVersion) {
        return true;
      }
    }

    return false;
  }

  /**
   * Adds http:// or https:// protocol to url if the protocol is missing
   */
  function addProtocol(url, secure) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
      url = ((secure) ? "https://" : "http://") + url;
    }
    return url;
  }

  return {
    addProtocol:              addProtocol,
    getQueryParameter:        getQueryParameter,
    getQueryStringParameter:  getQueryStringParameter,
    getFontCssStyle:          getFontCssStyle,
    addCSSRules:              addCSSRules,
    loadFonts:                loadFonts,
    loadCustomFont:           loadCustomFont,
    loadGoogleFonts:          loadGoogleFonts,
    loadScript:               loadScript,
    preloadImages:            preloadImages,
    getRiseCacheErrorMessage: getRiseCacheErrorMessage,
    unescapeHTML:             unescapeHTML,
    hasInternetConnection:    hasInternetConnection,
    isLegacy:                 isLegacy,
    getDateObjectFromPlayerVersionString: getDateObjectFromPlayerVersionString
  };
})();

/* global TweenLite, Linear */

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Scroller = function (params) {

  "use strict";

  var _scroller = null,
    _scrollerCtx = null,
    _secondary = null,
    _secondaryCtx = null,
    _tween = null,
    _items = [],
    _xpos = 0,
    _originalXpos = 0,
    _oversizedCanvas = false,
    _utils = RiseVision.Common.Utilities,
    MAX_CANVAS_SIZE = 32767;

  /*
   *  Private Methods
   */

  /* Initialize the secondary canvas from which text will be copied to the scroller. */
  function initSecondaryCanvas() {
    drawItems();
    fillScroller();

    if (_xpos > MAX_CANVAS_SIZE) {
      _oversizedCanvas = true;
      _secondary.width = MAX_CANVAS_SIZE;
      throwOversizedCanvesError();
    } else {
      _secondary.width = _xpos;
    }

    // Setting the width again resets the canvas so it needs to be redrawn.
    drawItems();
    fillScroller();
  }

  function throwOversizedCanvesError() {
    var event = new Event("scroller-oversized-canvas");
    _scroller.dispatchEvent(event);
  }

  function drawItems() {
    _xpos = 0;

    for (var i = 0; i < _items.length; i++) {
      if (_items[i].separator) {
        drawSeparator(_items[i]);
      }
      else {
        drawItem(_items[i]);
      }
    }
  }

  /* Draw a separator between items. */
  function drawSeparator(item) {
    var y = _secondary.height / 2,
      radius = item.size / 2;

    _secondaryCtx.save();

    _secondaryCtx.fillStyle = item.color;

    // Draw a circle.
    _secondaryCtx.beginPath();
    _secondaryCtx.arc(_xpos + radius, y, radius, 0, 2 * Math.PI);
    _secondaryCtx.fill();

    _xpos += item.size + 10;

    _secondaryCtx.restore();
  }

  function drawItem(item, isEllipsis) {
    var textObj = {},
      fontStyle;

    if (item) {
      textObj.text = _utils.unescapeHTML(item.text);

      if (item.fontStyle) {
        fontStyle = item.fontStyle;

        if (fontStyle.font && fontStyle.font.family) {
          textObj.font = fontStyle.font.family;
        }

        if (fontStyle.size) {
          textObj.size = fontStyle.size;
        }

        if (fontStyle.forecolor) {
          textObj.foreColor = fontStyle.forecolor;
        }

        if (fontStyle.bold) {
          textObj.bold = fontStyle.bold;
        }

        if (fontStyle.italic) {
          textObj.italic = fontStyle.italic;
        }

        if (fontStyle.backcolor && isEllipsis) {
          textObj.backcolor = fontStyle.backcolor;
        }
      }

      if (isEllipsis) {
        drawEllipsis(textObj);
      } else {
        drawText(textObj);
      }
    }
  }

  function drawText(textObj) {
    var font = "";

    _secondaryCtx.save();

    if (textObj.bold) {
      font = "bold ";
    }

    if (textObj.italic) {
      font += "italic ";
    }

    if (textObj.size) {
      font += textObj.size + " ";
    }

    if (textObj.font) {
      font += textObj.font;
    }

    // Set the text formatting.
    _secondaryCtx.font = font;
    _secondaryCtx.fillStyle = textObj.foreColor;
    _secondaryCtx.textBaseline = "middle";

    // Draw the text onto the canvas.
    _secondaryCtx.translate(0, _secondary.height / 2);
    _secondaryCtx.fillText(textObj.text, _xpos, 0);

    _xpos += _secondaryCtx.measureText(textObj.text).width + 10;

    _secondaryCtx.restore();
  }

  function drawEllipsis(ellipsisObj) {
    var font = "",
      ellipsisWidth,
      rectHeight;

    _secondaryCtx.save();

    if (ellipsisObj.bold) {
      font = "bold ";
    }

    if (ellipsisObj.italic) {
      font += "italic ";
    }

    if (ellipsisObj.size) {
      font += ellipsisObj.size + " ";
    }

    if (ellipsisObj.font) {
      font += ellipsisObj.font;
    }

    // Set the text formatting.
    _secondaryCtx.font = font;
    _secondaryCtx.textBaseline = "middle";

    ellipsisWidth = _secondaryCtx.measureText("  ...  ").width;
    rectHeight = ellipsisObj.size ? ((ellipsisObj.size.indexOf("px") > 0) ? parseInt(ellipsisObj.size.slice(0, ellipsisObj.size.indexOf("px")), 10) : ellipsisObj.size) : 10;

    _secondaryCtx.translate(0, _secondary.height / 2);

    // Default background rect color to white if set to "transparent" so it forces to overlay text
    _secondaryCtx.fillStyle = ellipsisObj.backcolor === "transparent" ? "#FFF" : ellipsisObj.backcolor;
    // Draw the background rect onto the canvas so it overlays the text
    _secondaryCtx.fillRect(MAX_CANVAS_SIZE - ellipsisWidth, -(rectHeight/2), ellipsisWidth, rectHeight);

    // Draw the ellipsis text onto the canvas overlaying background rect
    _secondaryCtx.fillStyle = ellipsisObj.foreColor;
    _secondaryCtx.fillText("  ...  ", MAX_CANVAS_SIZE - ellipsisWidth, 0);

    _secondaryCtx.restore();
  }

  function draw() {
    _scrollerCtx.clearRect(0, 0, _scroller.width, _scroller.height);
    _scrollerCtx.drawImage(_secondary, _scrollerCtx.xpos, 0);
  }

  function fillScroller() {
    var width = 0,
      lastIndex = 0,
      index = 0;

    _originalXpos = (_oversizedCanvas) ? MAX_CANVAS_SIZE : _xpos;

    // Ensure there's enough text to fill the scroller.
    if (_items.length > 0) {
      while (width < _scroller.width) {
        if (_items[index].separator) {
          drawSeparator(_items[index]);
        }
        else {
          drawItem(_items[index]);
        }

        width = _xpos - _originalXpos;
        lastIndex = index;
        index = (lastIndex === _items.length - 1) ? 0 : lastIndex + 1;
      }

      if (_oversizedCanvas) {
        drawItem(_items[lastIndex], true);
      }
    }
  }

  /* Get the scroll speed. */
  function getDelay() {
    var factor;

    if (params.transition && params.transition.speed) {
      switch (params.transition.speed) {
        case "slow":
          factor = 100;
          break;
        case "medium":
          factor = 150;
          break;
        case "fast":
          factor = 200;
          break;
        default:
          factor = 150;
      }
    }

    return _originalXpos / factor;
  }

  /* Scroller has completed a cycle. */
  function onComplete() {
    _tween = null;
    _scrollerCtx.xpos = 0;

    _scroller.dispatchEvent(new CustomEvent("done", { "bubbles": true }));
  }

  function createSecondaryCanvas() {
    _secondary = document.createElement("canvas");
    _secondary.id = "secondary";
    _secondary.style.display = "none";
    _secondaryCtx = initCanvas(_secondary);

    document.body.appendChild(_secondary);
  }

  function initCanvas(canvas) {
    var context = canvas.getContext("2d");

    canvas.width = params.width;
    canvas.height = params.height;
    context.xpos = 0;

    return context;
  }

  /*
   *  Public Methods
   */
  function init(items) {
    _items = items;
    _scroller = document.getElementById("scroller");
    _scrollerCtx = initCanvas(_scroller);

    createSecondaryCanvas();
    initSecondaryCanvas();

    TweenLite.ticker.addEventListener("tick", draw);
    _scroller.dispatchEvent(new CustomEvent("ready", { "bubbles": true }));
  }

  function refresh(items) {
    _items = items;
    _oversizedCanvas = false;

    initSecondaryCanvas();
  }

  function play() {
    if (!_tween) {
      _tween = TweenLite.to(_scrollerCtx, getDelay(), { xpos: -_originalXpos, ease: Linear.easeNone, onComplete: onComplete });
    }

    _tween.play();
  }

  function pause() {
    if (_tween) {
      _tween.pause();
    }
  }

  return {
    init: init,
    play: play,
    pause: pause,
    refresh: refresh
  };
};

/* global WIDGET_COMMON_CONFIG */

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.LoggerUtils = (function() {
  "use strict";

   var displayId = "",
     companyId = "",
     version = null;

  /*
   *  Private Methods
   */

  /* Retrieve parameters to pass to the event logger. */
  function getEventParams(params, cb) {
    var json = null;

    // event is required.
    if (params.event) {
      json = params;

      if (json.file_url) {
        json.file_format = params.file_format || getFileFormat(json.file_url);
      }

      json.company_id = companyId;
      json.display_id = displayId;

      if (version) {
        json.version = version;
      }

      cb(json);
    }
    else {
      cb(json);
    }
  }

  // Get suffix for BQ table name.
  function getSuffix() {
    var date = new Date(),
      year = date.getUTCFullYear(),
      month = date.getUTCMonth() + 1,
      day = date.getUTCDate();

    if (month < 10) {
      month = "0" + month;
    }

    if (day < 10) {
      day = "0" + day;
    }

    return "" + year + month + day;
  }

  /*
   *  Public Methods
   */
  function getFileFormat(url) {
    var hasParams = /[?#&]/,
      str;

    if (!url || typeof url !== "string") {
      return null;
    }

    str = url.substr(url.lastIndexOf(".") + 1);

    // don't include any params after the filename
    if (hasParams.test(str)) {
      str = str.substr(0 ,(str.indexOf("?") !== -1) ? str.indexOf("?") : str.length);

      str = str.substr(0, (str.indexOf("#") !== -1) ? str.indexOf("#") : str.length);

      str = str.substr(0, (str.indexOf("&") !== -1) ? str.indexOf("&") : str.length);
    }

    return str.toLowerCase();
  }

  function getInsertData(params) {
    var BASE_INSERT_SCHEMA = {
      "kind": "bigquery#tableDataInsertAllRequest",
      "skipInvalidRows": false,
      "ignoreUnknownValues": false,
      "templateSuffix": getSuffix(),
      "rows": [{
        "insertId": ""
      }]
    },
    data = JSON.parse(JSON.stringify(BASE_INSERT_SCHEMA));

    data.rows[0].insertId = Math.random().toString(36).substr(2).toUpperCase();
    data.rows[0].json = JSON.parse(JSON.stringify(params));
    data.rows[0].json.ts = new Date().toISOString();

    return data;
  }

  function logEvent(table, params) {
    getEventParams(params, function(json) {
      if (json !== null) {
        RiseVision.Common.Logger.log(table, json);
      }
    });
  }

  function logEventToPlayer(table, params) {
    try {
      top.postToPlayer( {
        message: "widget-log",
        table: table,
        params: JSON.stringify(params),
        suffix: getSuffix()
      } );
    } catch (err) {
      console.log("widget-common.logEventToPlayer", err);
    }
  }

  /* Set the Company and Display IDs. */
  function setIds(company, display) {
    companyId = company;
    displayId = display;
  }

  function setVersion(value) {
    version = value;
  }

  return {
    "getInsertData": getInsertData,
    "getFileFormat": getFileFormat,
    "logEvent": logEvent,
    "logEventToPlayer": logEventToPlayer,
    "setIds": setIds,
    "setVersion": setVersion
  };
})();

RiseVision.Common.Logger = (function(utils) {
  "use strict";

  var REFRESH_URL = "https://www.googleapis.com/oauth2/v3/token?client_id=" + WIDGET_COMMON_CONFIG.LOGGER_CLIENT_ID +
      "&client_secret=" + WIDGET_COMMON_CONFIG.LOGGER_CLIENT_SECRET +
      "&refresh_token=" + WIDGET_COMMON_CONFIG.LOGGER_REFRESH_TOKEN +
      "&grant_type=refresh_token";

  var serviceUrl = "https://www.googleapis.com/bigquery/v2/projects/client-side-events/datasets/Widget_Events/tables/TABLE_ID/insertAll",
    throttle = false,
    throttleDelay = 1000,
    lastEvent = "",
    refreshDate = 0,
    token = "";

  /*
   *  Private Methods
   */
  function refreshToken(cb) {
    var xhr = new XMLHttpRequest();

    if (new Date() - refreshDate < 3580000) {
      return cb({});
    }

    xhr.open("POST", REFRESH_URL, true);
    xhr.onloadend = function() {
      var resp = {};
      try {
        resp = JSON.parse(xhr.response);
      } catch(e) {
        console.warn("Can't refresh logger token - ", e.message);
      }
      cb({ token: resp.access_token, refreshedAt: new Date() });
    };

    xhr.send();
  }

  function isThrottled(event) {
    return throttle && (lastEvent === event);
  }

  /*
   *  Public Methods
   */
  function log(tableName, params) {
    if (!tableName || !params || (params.hasOwnProperty("event") && !params.event) ||
      (params.hasOwnProperty("event") && isThrottled(params.event))) {
      return;
    }

    // don't log if display id is invalid or preview/local
    if (!params.display_id || params.display_id === "preview" || params.display_id === "display_id" ||
      params.display_id === "displayId") {
      return;
    }

    try {
      if ( top.postToPlayer && top.enableWidgetLogging ) {
        // send log data to player instead of BQ
        return utils.logEventToPlayer( tableName, params );
      }
    } catch ( e ) {
      console.log( "widget-common: logger", e );
    }

    throttle = true;
    lastEvent = params.event;

    setTimeout(function () {
      throttle = false;
    }, throttleDelay);

    function insertWithToken(refreshData) {
      var xhr = new XMLHttpRequest(),
        insertData, url;

      url = serviceUrl.replace("TABLE_ID", tableName);
      refreshDate = refreshData.refreshedAt || refreshDate;
      token = refreshData.token || token;
      insertData = utils.getInsertData(params);

      // Insert the data.
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer " + token);

      if (params.cb && typeof params.cb === "function") {
        xhr.onloadend = function() {
          params.cb(xhr.response);
        };
      }

      xhr.send(JSON.stringify(insertData));
    }

    return refreshToken(insertWithToken);
  }

  return {
    "log": log
  };
})(RiseVision.Common.LoggerUtils);

/* global gadgets, _, $ */

var RiseVision = RiseVision || {};

RiseVision.RSS = {};

RiseVision.RSS = ( function( document, gadgets ) {
  "use strict";

  var _additionalParams = null,
    _prefs = new gadgets.Prefs(),
    _message = null,
    _riserss = null,
    _content = null,
    _currentFeed = null,
    _viewerPaused = true,
    _errorTimer = null,
    _errorFlag = false;

  /*
   *  Private Methods
   */
  function _ready() {
    gadgets.rpc.call( "", "rsevent_ready", null, _prefs.getString( "id" ), true, true, true, true, true );
  }

  function _done() {
    gadgets.rpc.call( "", "rsevent_done", null, _prefs.getString( "id" ) );
  }

  function _logConfiguration() {
    var layout = _isHorizontalScroll() ? "horizontal" : _additionalParams.layout,
      details = {
        layout: layout,
        layoutUrl: layout === "custom" ? _additionalParams.layoutUrl : null
      };

    logEvent( {
      event: "configuration",
      event_details: JSON.stringify( details ),
      feed_url: _additionalParams.url
    } );
  }

  function _noFeedItems() {
    var params = {
      "event": "warning",
      "event_details": "no feed items",
      "feed_url": _additionalParams.url
    };

    logEvent( params );
    showError( "There are no items to show from this RSS feed." );
  }

  function _clearErrorTimer() {
    clearTimeout( _errorTimer );
    _errorTimer = null;
  }

  function _startErrorTimer() {
    _clearErrorTimer();

    _errorTimer = setTimeout( function() {
      // notify Viewer widget is done
      _done();
    }, 5000 );
  }

  /* Show message that the feed is loading. */
  function _showLoadingMessage() {
    _message = new RiseVision.Common.Message( document.getElementById( "container" ),
      document.getElementById( "messageContainer" ) );

    _message.show( "Please wait while your feed is loaded." );
  }

  /* Load Google and custom fonts. */
  function _loadFonts( cb ) {
    var fontSettings = [
      {
        "class": "story_font-style",
        "fontStyle": _additionalParams.story.fontStyle
      }
    ];

    if ( _additionalParams.headline && !_.isEmpty( _additionalParams.headline.fontStyle ) ) {
      fontSettings.push( {
        "class": "headline_font-style",
        "fontStyle": _additionalParams.headline.fontStyle
      } );
    }

    if ( _additionalParams.timestamp && !_.isEmpty( _additionalParams.timestamp.fontStyle ) ) {
      fontSettings.push( {
        "class": "timestamp_font-style",
        "fontStyle": _additionalParams.timestamp.fontStyle
      } );
    }

    if ( _additionalParams.author && !_.isEmpty( _additionalParams.author.fontStyle ) ) {
      fontSettings.push( {
        "class": "author_font-style",
        "fontStyle": _additionalParams.author.fontStyle
      } );
    }

    if ( cb && ( typeof cb === "function" ) ) {
      RiseVision.Common.Utilities.loadFonts( fontSettings, cb );
    } else {
      RiseVision.Common.Utilities.loadFonts( fontSettings );
    }
  }

  function _initRiseRSS() {
    _riserss = new RiseVision.RSS.RiseRSS( _additionalParams );
    _riserss.init();
  }

  /* Load the layout file. */
  function _loadLayout() {
    var url = window.location.pathname,
      index = url.lastIndexOf( "/" ) + 1;

    url = url.substr( 0, index ) + "layouts/";

    if ( typeof _additionalParams.layout === "undefined" ) {
      url += "layout-4x1.html";
    } else if ( _additionalParams.layout === "custom" ) {
      url = _additionalParams.layoutUrl;
    } else {
      url += _additionalParams.layout + ".html";
    }

    // Load the layout and add it to the DOM.
    $.get( url )
      .done( function( data ) {
        _onLayoutLoaded( data );
      } )
      .fail( function() {
        _onLayoutNotLoaded( url );
      } );
  }

  /* Layout file was loaded successfully. */
  function _onLayoutLoaded( data ) {
    $( "#container" ).append( data );
    _showLoadingMessage();
    _loadFonts();
    _initRiseRSS();
    _ready();
  }

  /* Layout file failed to load. */
  function _onLayoutNotLoaded( url ) {
    _message = new RiseVision.Common.Message( document.getElementById( "container" ),
      document.getElementById( "messageContainer" ) );

    _message.show( "The layout file could not be loaded." );

    logEvent( {
      "event": "error",
      "event_details": "layout not loaded",
      "error_details": url,
      "feed_url": _additionalParams.url
    } );

    _ready();
  }

  function _isHorizontalScroll() {
    if ( !_additionalParams.transition ) {
      return false;
    } else if ( ( _additionalParams.transition.type === "scroll" ) && ( _additionalParams.transition.direction === "left" ) ) {
      return true;
    } else {
      return false;
    }
  }

  function _initHorizontalScroll() {
    document.getElementById( "scroller" ).style.display = "block";

    _showLoadingMessage();

    _loadFonts( function() {
      _initRiseRSS();
      _ready();
    } );
  }

  /*
   *  Public Methods
   */
  function getTableName() {
    return "rss_events";
  }

  function logEvent( params ) {
    RiseVision.Common.LoggerUtils.logEvent( getTableName(), params );
  }

  function onContentDone() {
    _done();
  }

  function onRiseRSSInit( feed ) {
    _content = new RiseVision.RSS.Content( _prefs, _additionalParams );

    if ( feed.items && feed.items.length > 0 ) {
      // remove a message previously shown
      _message.hide();

      _currentFeed = _.clone( feed );

      _content.init( _currentFeed );

      if ( !_viewerPaused ) {
        _content.play();
      }
    } else {
      _noFeedItems();
    }
  }

  function onRiseRSSRefresh( feed ) {
    var updated = false,
      i;

    if ( !feed.items || feed.items.length === 0 ) {
      _noFeedItems();
    } else if ( !_currentFeed || feed.items.length !== _currentFeed.items.length ) {
      updated = true;
    } else {
      // run through each item and compare, if any are different, feed has been updated
      for ( i = 0; i < _currentFeed.items.length; i += 1 ) {
        if ( !_.isEqual( feed.items[ i ], _currentFeed.items[ i ] ) ) {
          updated = true;
          break;
        }
      }
    }

    if ( updated ) {
      _currentFeed = _.clone( feed );

      if ( _errorFlag ) {
        if ( !_content ) {
          // create content module instance
          _content = new RiseVision.RSS.Content( _prefs, _additionalParams );
        }

        _message.hide();
        _content.init( _currentFeed );

        // refreshed feed fixed previous error, ensure flag is removed so next playback shows content
        _errorFlag = false;
      } else {
        _content.update( feed );
      }

    }
  }

  function pause() {
    _viewerPaused = true;

    if ( _errorFlag ) {
      _clearErrorTimer();
      return;
    }

    if ( _content ) {
      _content.pause();
    }
  }

  function play() {
    _viewerPaused = false;

    if ( _errorFlag ) {
      _startErrorTimer();
      return;
    }

    if ( _content ) {
      _content.play();
    }
  }

  function setAdditionalParams( additionalParams ) {
    _additionalParams = JSON.parse( JSON.stringify( additionalParams ) );
    _prefs = new gadgets.Prefs();

    _additionalParams.width = _prefs.getInt( "rsW" );
    _additionalParams.height = _prefs.getInt( "rsH" );

    document.getElementById( "container" ).style.width = _additionalParams.width + "px";
    document.getElementById( "container" ).style.height = _additionalParams.height + "px";

    _logConfiguration();

    if ( _isHorizontalScroll() ) {
      _initHorizontalScroll();
    } else {
      _loadLayout();
    }
  }

  function showError( message ) {
    _errorFlag = true;

    if ( !_content ) {
      _content = new RiseVision.RSS.Content( _prefs, _additionalParams );
    }

    _content.reset();
    _currentFeed = null;
    _message.show( message );

    if ( !_viewerPaused ) {
      _startErrorTimer();
    }
  }

  function stop() {
    pause();
  }

  return {
    "getTableName": getTableName,
    "logEvent": logEvent,
    "onContentDone": onContentDone,
    "onRiseRSSInit": onRiseRSSInit,
    "onRiseRSSRefresh": onRiseRSSRefresh,
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "showError": showError,
    "stop": stop
  };

} )( document, gadgets );

var RiseVision = RiseVision || {};

RiseVision.RSS = RiseVision.RSS || {};

RiseVision.RSS.Utils = ( function() {
  "use strict";

  /*
   *  Public  Methods
   */

  function stripScripts( html ) {
    var div = document.createElement( "div" ),
      scripts,
      i;

    div.innerHTML = html;
    scripts = div.getElementsByTagName( "script" );
    i = scripts.length;

    while ( i-- ) {
      scripts[ i ].parentNode.removeChild( scripts[ i ] );
    }

    return div.innerHTML;
  }

  /* Truncate text while preserving word boundaries. */
  function truncate( text, length ) {
    var maxLength = ( length ) ? length : 120;

    if ( text.length > maxLength ) {
      text = text.substring( 0, maxLength );

      // Ensure that we don't truncate mid-word.
      text = text.replace( /\w+$/, "" );
      text += " ...";
    }

    return text;
  }

  return {
    "stripScripts": stripScripts,
    "truncate": truncate
  };

} )();

var RiseVision = RiseVision || {};

RiseVision.RSS = RiseVision.RSS || {};
RiseVision.RSS.Images = {};

RiseVision.RSS.Images = ( function() {

  "use strict";

  var _imagesToLoad = [],
    _imageCount = 0,
    _images = [],
    _callback = null;

  function _onImageLoaded( image ) {
    _images.push( image );
    _imageCount += 1;

    if ( _imageCount === _imagesToLoad.length && _callback && typeof _callback === "function" ) {
      _callback();
    }
  }

  function _loadImage( url ) {
    var img = new Image();

    img.onload = function() {
      _onImageLoaded( this );
    };

    img.onerror = function() {
      _onImageLoaded( this );
    };

    img.src = url;
  }

  function _loadImages() {
    var i;

    for ( i = 0; i < _imagesToLoad.length; i += 1 ) {
      if ( _imagesToLoad[ i ] === null ) {
        _onImageLoaded( null );
      } else {
        _loadImage( _imagesToLoad[ i ] );
      }
    }
  }

  function load( images, callback ) {
    if ( images.length > 0 ) {
      _imagesToLoad = images;
      _images = [];
      _imageCount = 0;

      if ( callback ) {
        _callback = callback;
      }

      _loadImages();

    } else if ( callback && typeof callback === "function" ) {
      callback();
    }
  }

  function getImages() {
    return _images;
  }

  return {
    getImages: getImages,
    load: load
  };

} )();

var RiseVision = RiseVision || {};

RiseVision.RSS = RiseVision.RSS || {};

RiseVision.RSS.RiseRSS = function( data ) {
  "use strict";

  var _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var rss = document.querySelector( "rise-rss" );

    rss.addEventListener( "rise-rss-response", function( e ) {
      if ( e.detail && e.detail.feed ) {
        if ( _initialLoad ) {
          _initialLoad = false;

          RiseVision.RSS.onRiseRSSInit( e.detail.feed );

        } else {
          RiseVision.RSS.onRiseRSSRefresh( e.detail.feed );
        }
      }
    } );

    rss.addEventListener( "rise-rss-error", function( e ) {
      var errorDetails = "",
        params = {
          "event": "error",
          "feed_url": data.url
        };

      if ( e.detail && typeof e.detail === "string" ) {
        errorDetails = e.detail;
      } else if ( e.detail && Array.isArray( e.detail ) && e.detail.length > 0 ) {
        // rise-rss-error passes error from gadgets.io.makeRequest which is always an Array with one item
        errorDetails = e.detail[ 0 ];
      }

      params.error_details = errorDetails;
      params.event_details = "rise rss error";

      if ( errorDetails.toLowerCase() === "401 unauthorized" ) {
        params.event_details = "feed authentication error";
        RiseVision.RSS.showError( "The feed at the URL provided cannot be shown because it is " +
          "protected and requires authentication." );
      } else if ( errorDetails.toLowerCase() === "404 not found" ) {
        params.event_details = "feed not found";
        RiseVision.RSS.showError( "The feed URL <span class='error-link'>" + data.url + "</span> could not be found." );
      } else if ( errorDetails.toLowerCase() === "not a feed" ) {
        RiseVision.RSS.showError( "The URL provided is not an RSS feed." );
      } else if ( errorDetails.indexOf( "403" ) > 0 && errorDetails.toLowerCase().indexOf( "forbidden" ) > 0 ) {
        params.event_details = "feed request error";
        RiseVision.RSS.showError( "Sorry, there was a problem requesting the RSS feed, please contact the owner of the RSS feed to resolve." );
      } else {
        RiseVision.RSS.showError( "Sorry, there was a problem with the RSS feed." );
      }

      RiseVision.RSS.logEvent( params );
    } );

    rss.setAttribute( "url", data.url );

    if ( data.itemsInQueue ) {
      rss.setAttribute( "entries", data.itemsInQueue );
    }

    rss.go();
  }

  return {
    "init": init
  };
};

/* global $ */

var RiseVision = RiseVision || {};

RiseVision.RSS = RiseVision.RSS || {};

RiseVision.RSS.TransitionNoScroll = function( params, content ) {

  "use strict";

  var _items = [],
    _currentItemIndex = 0,
    _transitionIntervalId = null,
    _waitingForUpdate = false,
    _waitingToStart = false;

  /*
   *  Private Methods
   */
  function _getTransitionConfig( index ) {
    var config = {};

    if ( ( index + params.itemsToShow ) >= ( _items.length - 1 ) ) {
      // account for not enough items to actually show from the feed
      config.itemsToShow = _items.length - ( index + 1 );
      config.currentItemIndex = ( _items.length - 1 );
    } else {
      config.itemsToShow = params.itemsToShow;
      // value is the index of the last item showing
      config.currentItemIndex = index + params.itemsToShow;
    }

    return config;
  }

  function _getStartConfig() {
    var config = {};

    if ( _items.length <= params.itemsToShow ) {
      // account for not enough items to actually show from the feed
      config.itemsToShow = _items.length;
      config.currentItemIndex = ( _items.length - 1 );
    } else {
      config.itemsToShow = params.itemsToShow;
      // value is the index of the last item showing
      config.currentItemIndex = ( params.itemsToShow - 1 );
    }

    return config;
  }

  function _clearPage( cb ) {
    $( ".page" ).empty();

    if ( !cb || typeof cb !== "function" ) {
      return;
    } else {
      cb();
    }
  }

  function _clear( cb ) {
    if ( params.transition.type === "fade" ) {
      $( ".item" ).one( "webkitTransitionEnd transitionend", function() {
        _clearPage( cb );
      } );

      $( ".item" ).addClass( "fade-out" ).removeClass( "fade-in" );
    } else {
      _clearPage( cb );
    }
  }

  function _show( index ) {
    content.showItem( index );

    if ( params.transition.type === "fade" ) {
      $( ".item" ).addClass( "fade-in" );
    }

    $( ".item" ).removeClass( "hide" );
  }

  function _makeTransition() {
    var startConfig = _getStartConfig(),
      transConfig = _getTransitionConfig( _currentItemIndex ),
      startingIndex,
      i;

    if ( _currentItemIndex === ( _items.length - 1 ) ) {

      _stopTransitionTimer();

      _clear( function() {

        // show the items
        for ( i = 0; i < startConfig.itemsToShow; i += 1 ) {
          _show( i );
        }

        _currentItemIndex = startConfig.currentItemIndex;

        RiseVision.RSS.onContentDone();
      } );

      _waitingForUpdate = false;

      return;
    }

    if ( _waitingForUpdate ) {
      _waitingForUpdate = false;

      content.loadImages( function() {
        _clear( function() {
          for ( i = 0; i < startConfig.itemsToShow; i += 1 ) {
            _show( i );
          }

          _currentItemIndex = startConfig.currentItemIndex;
        } );
      } );

    } else {
      startingIndex = _currentItemIndex + 1;

      _currentItemIndex = transConfig.currentItemIndex;

      _clear( function() {
        for ( i = startingIndex; i < ( startingIndex + transConfig.itemsToShow ); i += 1 ) {
          _show( i );
        }
      } );
    }

  }

  function _startTransitionTimer() {
    // legacy, backwards compatibility for duration value
    var duration = ( params.transition.duration / 1000 >= 1 ) ? params.transition.duration : params.transition.duration * 1000;

    if ( _transitionIntervalId === null ) {
      _transitionIntervalId = setInterval( function() {
        _makeTransition();
      }, duration );
    }
  }

  function _stopTransitionTimer() {
    clearInterval( _transitionIntervalId );
    _transitionIntervalId = null;
  }

  /*
   *  Public Methods
   */
  function init( items ) {
    var startConfig,
      i;

    _items = items;
    startConfig = _getStartConfig();

    _currentItemIndex = startConfig.currentItemIndex;

    // show the items
    for ( i = 0; i < startConfig.itemsToShow; i += 1 ) {
      _show( i );
    }

    if ( _waitingToStart ) {
      _waitingToStart = false;
      start();
    }
  }

  function reset() {
    _clear();
    _waitingToStart = false;
    _waitingForUpdate = false;
    _items = [];
  }

  function start() {
    if ( _items.length > 0 ) {
      _startTransitionTimer();
    } else {
      _waitingToStart = true;
    }
  }

  function stop() {
    _waitingToStart = false;
    _stopTransitionTimer();
  }

  function update( items ) {
    _items = items;
    _waitingForUpdate = true;
  }

  return {
    init: init,
    reset: reset,
    start: start,
    stop: stop,
    update: update
  };

};

/* global $ */

var RiseVision = RiseVision || {};

RiseVision.RSS = RiseVision.RSS || {};

RiseVision.RSS.TransitionVerticalScroll = function( params, content ) {
  "use strict";

  var _items = [],
    _waitingForUpdate = false,
    _waitingToStart = false,
    _pudTimerID = null;

  /*
   *  Private Methods
   */
  function _clearPage() {
    $( ".page" ).empty();
  }

  function _getScrollEl() {
    var $scrollContainer = $( "#container" );

    if ( typeof $scrollContainer.data( "plugin_autoScroll" ) !== "undefined" ) {
      return $scrollContainer.data( "plugin_autoScroll" );
    }

    return null;
  }

  function _removeAutoscroll() {
    var $scrollContainer = _getScrollEl();

    if ( $scrollContainer ) {
      // remove the "done" event handler before destroying
      $( "#container" ).autoScroll().off( "done", _onScrollDone );
      // destroy the auto scroll instance
      $scrollContainer.destroy();

      // ensure page visibility is back on from possible previous fade out (scroll complete)
      $( ".page" ).css( "visibility", "inherit" );
      $( ".page" ).css( "opacity", "1" );
    }
  }

  function _showItems() {
    var i;

    // show all the items
    for ( i = 0; i < _items.length; i += 1 ) {
      content.showItem( i );
    }

    $( ".item" ).removeClass( "hide" );
  }

  // If there is not enough content to scroll, use the PUD Failover setting as the trigger
  // for sending "done".
  function _startPUDTimer() {
    var delay;

    if ( ( params.transition.pud === undefined ) || ( params.transition.pud < 1 ) ) {
      delay = 10000;
    } else {
      delay = params.transition.pud * 1000;
    }

    if ( !_pudTimerID ) {
      _pudTimerID = setTimeout( function() {

        _pudTimerID = null;
        _onScrollDone();

      }, delay );
    }
  }

  function _onScrollDone() {
    if ( _waitingForUpdate ) {
      _waitingForUpdate = false;

      _removeAutoscroll();

      content.loadImages( function() {
        _clearPage();
        _showItems();
        _applyAutoScroll();

        RiseVision.RSS.onContentDone();
      } );

    } else {
      RiseVision.RSS.onContentDone();
    }
  }

  function _applyAutoScroll() {
    var $scrollContainer = $( "#container" );

    // apply auto scroll
    $scrollContainer.autoScroll( {
      "by": ( params.transition.type === "scroll" ) ? "continuous" : "page",
      "speed": params.transition.speed,
      "duration": params.transition.duration,
      "pause": params.transition.resume
    } ).on( "done", _onScrollDone );
  }

  /*
   *  Public Methods
   */
  function init( items ) {
    _items = items;

    _showItems();
    _applyAutoScroll();

    if ( _waitingToStart ) {
      _waitingToStart = false;
      start();
    }
  }

  function reset() {
    _removeAutoscroll();
    _clearPage();

    _waitingToStart = false;
    _items = [];
  }

  function start() {
    var $scroll = _getScrollEl();

    if ( _items.length > 0 ) {
      if ( $scroll && $scroll.canScroll() ) {
        $scroll.play();
      } else {
        _startPUDTimer();
      }
    } else {
      _waitingToStart = true;
    }
  }

  function stop() {
    var $scroll = _getScrollEl();

    _waitingToStart = false;

    if ( $scroll && $scroll.canScroll() ) {
      $scroll.pause();
    }

    // Clear the PUD timer if the playlist item is not set to PUD.
    if ( _pudTimerID ) {
      clearTimeout( _pudTimerID );
      _pudTimerID = null;
    }
  }

  function update( items ) {
    _items = items;
    _waitingForUpdate = true;
  }

  return {
    init: init,
    reset: reset,
    start: start,
    stop: stop,
    update: update
  };

};

var RiseVision = RiseVision || {};

RiseVision.RSS = RiseVision.RSS || {};

RiseVision.RSS.HorizontalScroll = function( params, content ) {
  "use strict";

  var _items = [],
    _waitingForUpdate = false,
    _waitingToStart = false,
    _scrollerReady = false,
    _scroller = null;

  /*
   *  Private Methods
   */

  function _initScroller() {
    var scrollerElem = document.querySelector( "#scroller" );

    _scroller = new RiseVision.Common.Scroller( params );

    scrollerElem.addEventListener( "scroller-oversized-canvas", function() {

      RiseVision.RSS.logEvent( {
        "event": "warning",
        "event_details": "canvas width is over the max size",
        "feed_url": params.url
      } );

    } );

    scrollerElem.addEventListener( "ready", _onScrollerReady );
    scrollerElem.addEventListener( "done", _onScrollerDone );

    _scroller.init( _getItems() );
  }

  function _getItems() {
    var title = "",
      author = "",
      date = "",
      story = "",
      item = null,
      items = [],
      showSeparator = params.separator && params.separator.show,
      i;

    for ( i = 0; i < _items.length; i++ ) {
      title = content.getTitle( _items[ i ] );
      author = content.getAuthor( _items[ i ] );
      date = content.getDate( _items[ i ] );
      story = content.getStory( _items[ i ] );

      // Title
      if ( title && ( ( typeof params.dataSelection.showTitle === "undefined" ) || params.dataSelection.showTitle ) ) {
        item = {};
        item.text = title;
        item.fontStyle = params.headline.fontStyle;
        items.push( item );
      }

      // Author
      if ( author && ( ( typeof params.dataSelection.showAuthor === "undefined" ) || params.dataSelection.showAuthor ) ) {
        item = {};
        item.text = author;
        item.fontStyle = params.author.fontStyle;
        items.push( item );
      }

      // Date
      if ( date && ( ( typeof params.dataSelection.showTimestamp === "undefined" ) || params.dataSelection.showTimestamp ) ) {
        item = {};
        item.text = date;
        item.fontStyle = params.timestamp.fontStyle;
        items.push( item );
      }

      // Story
      if ( story ) {
        item = {};
        item.text = story;
        item.fontStyle = params.story.fontStyle;
        items.push( item );
      }

      if ( showSeparator ) {
        item = {};
        item.separator = true;
        item.size = params.separator.size;
        item.color = params.separator.color;
        items.push( item );
      }
    }

    return items;
  }

  function _onScrollerReady() {
    _scrollerReady = true;
    start();
  }

  function _onScrollerDone() {
    if ( _waitingForUpdate ) {
      _waitingForUpdate = false;

      // Refresh scroller.
      _scroller.refresh( _getItems() );
    }

    RiseVision.RSS.onContentDone();
  }

  /*
   *  Public Methods
   */
  function init( items ) {
    document.getElementById( "container" ).style.display = "none";

    _items = items;
    _initScroller();

    if ( _waitingToStart ) {
      _waitingToStart = false;
      start();
    }
  }

  function reset() {
    _waitingToStart = false;
    _items = [];
  }

  function start() {
    if ( _scroller && _scrollerReady && ( _items.length > 0 ) ) {
      _scroller.play();
    } else {
      _waitingToStart = true;
    }
  }

  function stop() {
    _waitingToStart = false;

    if ( _scroller ) {
      _scroller.pause();
    }
  }

  function update( items ) {
    _items = items;
    _waitingForUpdate = true;
  }

  return {
    init: init,
    reset: reset,
    start: start,
    stop: stop,
    update: update
  };
};

/* global _, $ */

var RiseVision = RiseVision || {};

RiseVision.RSS = RiseVision.RSS || {};

RiseVision.RSS.Content = function( prefs, params ) {

  "use strict";

  var _items = [],
    _utils = RiseVision.RSS.Utils,
    _images = RiseVision.RSS.Images,
    _transition = null,
    _imageTypes = [ "image/bmp", "image/gif", "image/jpeg", "image/jpg", "image/png", "image/tiff" ];

  /*
   *  Private Methods
   */
  function _getItemHeight() {
    // account for not enough items to actually show compared to setting value
    var itemsToShow = ( _items.length <= params.itemsToShow ) ? _items.length : params.itemsToShow;

    if ( params.separator && params.separator.show ) {
      return params.height / itemsToShow - params.separator.size;
    } else {
      return params.height / itemsToShow;
    }
  }

  function _getImageUrl( item ) {
    var imageUrl = null;

    if ( _.has( item, "enclosures" ) && item.enclosures[ 0 ] && ( _.contains( _imageTypes, item.enclosures[ 0 ].type ) ) ) {
      imageUrl = item.enclosures[ 0 ].url;
    } else if ( item.image && item.image.url ) {
      imageUrl = item.image.url;
    }

    return imageUrl;
  }

  function _getImageUrls() {
    var urls = [],
      i;

    for ( i = 0; i < _items.length; i += 1 ) {
      urls.push( _getImageUrl( _items[ i ] ) );
    }

    return urls;
  }

  function _getImageDimensions( $image, item ) {
    var dimensions = null,
      marginWidth = parseInt( $image.css( "margin-left" ), 10 ) + parseInt( $image.css( "margin-right" ), 10 ),
      marginHeight = parseInt( $image.css( "margin-top" ), 10 ) + parseInt( $image.css( "margin-bottom" ), 10 ),
      ratioX,
      ratioY,
      scale;

    switch ( params.layout ) {
    case "layout-4x1":
      dimensions = {};
      dimensions.width = params.width * 0.33;
      dimensions.height = ( params.height / params.itemsToShow ) - marginHeight;

      break;

    case "layout-2x1":
      dimensions = {};

      if ( $( item ).find( ".story" ).length === 0 ) {
        dimensions.width = params.width - marginWidth;
      } else {
        dimensions.width = params.width * 0.5;
      }

      dimensions.height = ( params.height / params.itemsToShow ) - $( item ).find( ".textWrapper" ).outerHeight( true ) - marginHeight;

      break;

    case "layout-16x9":
      dimensions = {};
      dimensions.width = params.width - marginWidth;
      dimensions.height = ( params.height / params.itemsToShow ) - marginHeight;

      break;
    case "layout-1x2":
      dimensions = {};
      dimensions.width = params.width - marginWidth;
      dimensions.height = ( ( params.height / params.itemsToShow ) - marginHeight ) / 2;
      break;

    case "layout-photo":
    case "layout-photo_dark":
      dimensions = {};
      if ( $image.width() < $image.height() ) {
        dimensions.width = $image.width();
        dimensions.height = $image.height();
      } else {
        dimensions.width = params.width - marginWidth;
        dimensions.height = ( params.height / params.itemsToShow ) - marginHeight;
      }
      break;

    case "layout-poster":
      // dimensions is null
      break;
    }

    if ( dimensions ) {
      ratioX = dimensions.width / parseInt( $image.width() );
      ratioY = dimensions.height / parseInt( $image.height() );
      scale = ratioX < ratioY ? ratioX : ratioY;

      dimensions.width = parseInt( parseInt( $image.width() ) * scale );
      dimensions.height = parseInt( parseInt( $image.height() ) * scale );
    }

    return dimensions;
  }

  function _getTemplate( item, index ) {
    var title = getTitle( item ),
      story = getStory( item ),
      author = getAuthor( item ),
      imageUrl = _getImageUrl( item ),
      date = getDate( item ),
      template = document.querySelector( "#layout" ).content,
      $content = $( template.cloneNode( true ) ),
      removeSeparator = false,
      $story,
      clone,
      image;

    // Headline
    if ( !item.title || ( ( typeof params.dataSelection.showTitle !== "undefined" ) &&
      !params.dataSelection.showTitle ) ) {
      $content.find( ".headline" ).remove();
    } else {
      $content.find( ".headline" ).css( "textAlign", params.headline.fontStyle.align );
      $content.find( ".headline a" ).html( title ).text();
    }

    // Timestamp
    if ( !date || ( ( typeof params.dataSelection.showTimestamp !== "undefined" ) &&
      !params.dataSelection.showTimestamp ) ) {
      removeSeparator = true;
      $content.find( ".timestamp" ).remove();
    } else {
      if ( params.timestamp ) {
        $content.find( ".timestamp" ).css( "textAlign", params.timestamp.fontStyle.align );
      }
      $content.find( ".timestamp" ).text( date );
    }

    // Author
    if ( !author || ( ( typeof params.dataSelection.showAuthor !== "undefined" ) &&
      !params.dataSelection.showAuthor ) ) {
      removeSeparator = true;
      $content.find( ".author" ).remove();
    } else {
      if ( params.author ) {
        $content.find( ".author" ).css( "textAlign", params.author.fontStyle.align );
      }
      $content.find( ".author" ).text( author );
    }

    if ( removeSeparator ) {
      $content.find( ".separator" ).remove();
    }

    // Image
    if ( !imageUrl || ( ( typeof params.dataSelection.showImage !== "undefined" ) &&
      !params.dataSelection.showImage ) ) {
      $content.find( ".image" ).remove();
    } else {
      // get preloaded image pertaining to this item based on index value
      image = _images.getImages()[ index ];

      if ( image ) {
        $content.find( ".image" ).attr( "src", imageUrl );
      }
    }

    // Story
    if ( !story ) {
      $content.remove( ".story" );
    } else {
      $story = $content.find( ".story" );
      $story.css( "textAlign", params.story.fontStyle.align );
      $story.html( story );

      // apply the story font styling to child elements as well.
      $story.find( "p" ).addClass( "story_font-style" );
      $story.find( "div" ).addClass( "story_font-style" );
      $story.find( "span" ).addClass( "story_font-style" );
    }

    clone = $( document.importNode( $content[ 0 ], true ) );

    return clone;
  }

  function _setImageDimensions() {
    $( ".item" ).each( function() {
      var $image = $( this ).find( ".image" ),
        dimensions = null;

      if ( $image ) {
        dimensions = _getImageDimensions( $image, this );

        if ( dimensions ) {
          $image.width( dimensions.width );
          $image.height( dimensions.height );
        }
      }

    } );
  }

  function _showItem( index ) {
    $( ".page" ).append( _getTemplate( _items[ index ], index ) );

    _setImageDimensions();

    if ( params.separator && params.separator.show ) {
      $( ".item" ).css( "border-bottom", "solid " + params.separator.size + "px " + params.separator.color );
    }

    if ( _layoutNeedsItemHeight() === true ) {
      $( ".item" ).height( _getItemHeight() );

      // 16x9 (images only) layout doesn't need truncating, image sizing handled in _setImageDimensions()
      if ( params.layout !== "layout-16x9" ) {
        // truncate content
        $( ".item" ).dotdotdot( {
          height: _getItemHeight()
        } );
      }
    }
  }

  function _layoutNeedsItemHeight() {
    switch ( params.layout ) {
    case "layout-photo":
    case "layout-photo_dark":
    case "layout-poster":
      return false;
    default:
      return true;
    }
  }

  /*
   *  Public Methods
   */
  function init( feed ) {
    /*jshint validthis:true */

    _items = feed.items;

    if ( !_transition ) {

      if ( !params.transition ) {
        // legacy, backwards compatible
        params.transition = {
          type: "none",
          duration: 10,
          direction: "up"
        };
      }

      if ( params.transition.type === "none" || params.transition.type === "fade" ) {
        _transition = new RiseVision.RSS.TransitionNoScroll( params, this );
      } else if ( params.transition.type === "scroll" ) {
        if ( params.transition.direction === "up" ) {
          _transition = new RiseVision.RSS.TransitionVerticalScroll( params, this );
        } else if ( params.transition.direction === "left" ) {
          _transition = new RiseVision.RSS.HorizontalScroll( params, this );
        }
      } else if ( params.transition.type === "page" ) {
        _transition = new RiseVision.RSS.TransitionVerticalScroll( params, this );
      }
    }

    loadImages( function() {
      _transition.init( _items );
    } );
  }

  function getAuthor( item ) {
    var author = null;

    if ( item.author ) {
      author = item.author;
    } else if ( _.has( item, "dc:creator" ) ) {
      author = item[ "dc:creator" ][ "#" ];
    }

    return author;
  }

  function getDate( item ) {
    var pubdate = item.date,
      formattedDate = null,
      options;

    if ( pubdate ) {
      pubdate = new Date( pubdate );
      options = {
        year: "numeric", month: "long", day: "numeric"
      };

      formattedDate = pubdate.toLocaleDateString( "en-us", options );
    }

    return formattedDate;
  }

  function getStory( item ) {
    var story = null;

    if ( _.has( item, "description" ) ) {

      if ( params.dataSelection.showDescription === "full" ) {

        story = _utils.stripScripts( item.description );

      } else if ( params.dataSelection.showDescription === "snippet" && params.dataSelection.snippetLength > 0 ) {

        story = _utils.truncate( $( "<div/>" ).html( _utils.stripScripts( item.description ) ).text(), params.dataSelection.snippetLength );
      }
    }

    return story;
  }

  function getTitle( item ) {
    var title = null;

    if ( item.title ) {
      title = _utils.stripScripts( item.title );
    }

    return title;
  }

  function loadImages( cb ) {
    // load all images
    _images.load( _getImageUrls(), function() {
      if ( cb && typeof cb === "function" ) {
        cb();
      }
    } );
  }

  function pause() {
    if ( _transition ) {
      _transition.stop();
    }
  }

  function play() {
    if ( _transition ) {
      _transition.start();
    }
  }

  function reset() {
    if ( _transition ) {
      _transition.stop();
      _transition.reset();
    }

    _items = [];
  }

  function showItem( index ) {
    _showItem( index );
  }

  function update( feed ) {
    _items = feed.items;

    if ( _transition ) {
      _transition.update( _items );
    }
  }

  return {
    init: init,
    getAuthor: getAuthor,
    getDate: getDate,
    getStory: getStory,
    getTitle: getTitle,
    loadImages: loadImages,
    pause: pause,
    play: play,
    reset: reset,
    showItem: showItem,
    update: update
  };
};

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Message = function (mainContainer, messageContainer) {
  "use strict";

  var _active = false;

  function _init() {
    try {
      messageContainer.style.height = mainContainer.style.height;
    } catch (e) {
      console.warn("Can't initialize Message - ", e.message);
    }
  }

  /*
   *  Public Methods
   */
  function hide() {
    if (_active) {
      // clear content of message container
      while (messageContainer.firstChild) {
        messageContainer.removeChild(messageContainer.firstChild);
      }

      // hide message container
      messageContainer.style.display = "none";

      // show main container
      mainContainer.style.display = "block";

      _active = false;
    }
  }

  function show(message) {
    var fragment = document.createDocumentFragment(),
      p;

    if (!_active) {
      // hide main container
      mainContainer.style.display = "none";

      messageContainer.style.display = "block";

      // create message element
      p = document.createElement("p");
      p.innerHTML = message;
      p.setAttribute("class", "message");

      fragment.appendChild(p);
      messageContainer.appendChild(fragment);

      _active = true;
    } else {
      // message already being shown, update message text
      p = messageContainer.querySelector(".message");
      p.innerHTML = message;
    }
  }

  _init();

  return {
    "hide": hide,
    "show": show
  };
};

/* global gadgets, RiseVision */

( function( window, document, gadgets ) {
  "use strict";

  var prefs = new gadgets.Prefs(),
    id = prefs.getString( "id" ),
    webComponentsReadyIntervalId = 0;

  // Disable context menu (right click menu)
  window.oncontextmenu = function() {
    return false;
  };

  document.body.onmousedown = function() {
    return false;
  };

  function configure( names, values ) {
    var additionalParams,
      companyId = "",
      displayId = "";

    if ( Array.isArray( names ) && names.length > 0 && Array.isArray( values ) && values.length > 0 ) {
      if ( names[ 0 ] === "companyId" ) {
        companyId = values[ 0 ];
      }

      if ( names[ 1 ] === "displayId" ) {
        if ( values[ 1 ] ) {
          displayId = values[ 1 ];
        } else {
          displayId = "preview";
        }
      }

      RiseVision.Common.LoggerUtils.setIds( companyId, displayId );

      if ( names[ 2 ] === "additionalParams" ) {
        additionalParams = JSON.parse( values[ 2 ] );

        RiseVision.RSS.setAdditionalParams( additionalParams );
      }
    }
  }

  function play() {
    RiseVision.RSS.play();
  }

  function pause() {
    RiseVision.RSS.pause();
  }

  function stop() {
    RiseVision.RSS.stop();
  }

  function webComponentsReady() {
    window.removeEventListener( "WebComponentsReady", webComponentsReady );
    clearTimeout( webComponentsReadyIntervalId );

    if ( id && id !== "" ) {
      gadgets.rpc.register( "rscmd_play_" + id, play );
      gadgets.rpc.register( "rscmd_pause_" + id, pause );
      gadgets.rpc.register( "rscmd_stop_" + id, stop );
      gadgets.rpc.register( "rsparam_set_" + id, configure );
      gadgets.rpc.call( "", "rsparam_get", null, id, [ "companyId", "displayId", "additionalParams" ] );
    }
  }

  // in Chrome WebComponentsReady is never fired, because in webcomponentsjs, function bootstrap,
  // the callback of requestAnimationFrame is called after gadgets.rpc.register for some reason
  // in Android (and Firefox) WebComponentsReady does get fired
  // so for Chrome we do setTimeout and for Android we do addEventListener
  webComponentsReadyIntervalId = setTimeout( webComponentsReady, 2000 );
  window.addEventListener( "WebComponentsReady", webComponentsReady );

} )( window, document, gadgets );


