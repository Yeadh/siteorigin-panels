var panels = window.panels, $ = jQuery;

module.exports = Backbone.View.extend( {

    stylesLoaded: false,

    initialize: function(){

    },

    /**
     * Render the visual styles object.
     *
     * @param type
     * @param postId
     */
    render: function( stylesType, postId, args ){
        if( typeof stylesType === 'undefined' ) {
            return false;
        }

        // Add in the default args
        args  = _.extend( {
            builderType : ''
        }, args );

        this.$el.addClass('so-visual-styles');

        // Load the form
        var thisView = this;
        $.post(
            panelsOptions.ajaxurl,
            {
                action: 'so_panels_style_form',
                type: stylesType,
                style: this.model.get('style'),
                args : JSON.stringify( args ),
                postId: postId
            },
            function( response ){
                thisView.$el.html( response );
                thisView.setupFields();
                thisView.stylesLoaded = true;
                thisView.trigger('styles_loaded', !_.isEmpty(response));
            }
        );

	    return this;
    },

    /**
     * Attach the style view to the DOM.
     *
     * @param wrapper
     */
    attach: function( wrapper ){
        wrapper.append( this.$el );
    },

    /**
     * Detach the styles view from the DOM
     */
    detach: function(){
        this.$el.detach();
    },

    /**
     * Setup all the fields
     */
    setupFields: function(){

        // Set up the sections as collapsible
        this.$('.style-section-wrapper').each(function(){
            var $s = $(this);

            $s.find('.style-section-head').click( function(e){
                e.preventDefault();
                $s.find('.style-section-fields').slideToggle('fast');
            } );
        });

        // Set up the color fields
        if(typeof $.fn.wpColorPicker !== 'undefined') {
            if (typeof(panelsOptions.wpColorPickerOptions.palettes) == 'object' && !$.isArray(panelsOptions.wpColorPickerOptions.palettes)) {
                panelsOptions.wpColorPickerOptions.palettes = $.map(panelsOptions.wpColorPickerOptions.palettes, function(el) { return el; });
            }
            this.$('.so-wp-color-field').wpColorPicker(panelsOptions.wpColorPickerOptions);
        }

        // Set up the image select fields
        this.$('.style-field-image').each( function(){
            var frame = null;
            var $s = $(this);

            $s.find('.so-image-selector').click( function( e ){
                e.preventDefault();

                if( frame === null ) {
                    // Create the media frame.
                    frame = wp.media({
                        // Set the title of the modal.
                        title: 'choose',

                        // Tell the modal to show only images.
                        library: {
                            type: 'image'
                        },

                        // Customize the submit button.
                        button: {
                            // Set the text of the button.
                            text: 'Done',
                            close: true
                        }
                    });

                    frame.on( 'select', function(){
                        var attachment = frame.state().get('selection').first().attributes;

                        var url = attachment.url;
                        if(!_.isUndefined(attachment.sizes)) {
                            try {
                                url = attachment.sizes.thumbnail.url;
                            }
                            catch(e) {
                                // We'll use the full image instead
                                url = attachment.sizes.full.url;
                            }
                        }
                        $s.find( '.current-image' ).css( 'background-image', 'url(' + url + ')' );

                        // Store the ID
                        $s.find('input').val( attachment.id )
                    } );
                }

                frame.open();

            } );

            // Handle clicking on remove
            $s.find('.remove-image').click(function(e){
                e.preventDefault();
                $s.find( '.current-image').css('background-image', 'none');
                $s.find('input').val( '' );
            });
        } );

        // Set up all the measurement fields
        this.$('.style-field-measurement').each(function(){
            var $$ = jQuery(this);

            var text = $$.find('input[type="text"]');
            var unit = $$.find('select');
            var hidden = $$.find('input[type="hidden"]');

            // Load the value from the hidden field
            if( hidden.val() !== '' ) {
                var re = /(?:([0-9\.,]+)(.*))+/;
                var valueList = hidden.val().split(' ');
                var valueListValue = [];
                for (var i in valueList) {
                    var match = re.exec(valueList[i]);
                    if (match != null && typeof match[1] !== 'undefined' && typeof match[2] !== 'undefined') {
                        valueListValue.push(match[1]);
                        unit.val(match[2]);
                    }
                }
                text.val(valueListValue.join(' '));
            }

            var setVal = function(){
                var fullString = text
                    .val()
                    .split(' ')
                    .filter(function(value) { return value !== '' })
                    .map(function(value) { return value + unit.val(); })
                    .join(' ');
                hidden.val( fullString );
            };

            // Set the value when ever anything changes
            text.keyup(setVal).change(setVal);
            unit.change(setVal);
        } );
    }

} );
