// Override the default dialog action
// Original at line 1153

// modified from http://trac.wymeditor.org/trac/ticket/63

// Called in postInit()
/*
postInit: function(wym) {
    wym.modal_dialog(wym);
},

*/

(function($) {

var $wym_dialog = $([]);
var modal_dialog;
var savedSelection;

WYMeditor.editor.prototype.dialog = function( dialogType, dialogFeatures, bodyHtml ) 
{
    var features = dialogFeatures || this._wym._options.dialogFeatures;
    var sBodyHtml = "";
    
    this._options.dialogLinkHtml = wym_dialogLinkHtml;
    this._options.dialogImageHtml = wym_dialogImageHtml;
    this._options.dialogTableHtml = wym_dialogTableHtml;
    this._options.dialogPasteHtml = wym_dialogPasteHtml;
    
    this._options.dialogHtml = WYMeditor.DIALOG_BODY;

    switch( dialogType ) 
    {
        case(WYMeditor.DIALOG_LINK):
            sBodyHtml = this._options.dialogLinkHtml;
        break;
        case(WYMeditor.DIALOG_IMAGE):
            sBodyHtml = this._options.dialogImageHtml;
        break;
        case(WYMeditor.DIALOG_TABLE):
            sBodyHtml = this._options.dialogTableHtml;
        break;
        case(WYMeditor.DIALOG_PASTE):
            sBodyHtml = this._options.dialogPasteHtml;
        break;
        case(WYMeditor.PREVIEW):
            sBodyHtml = this._options.dialogPreviewHtml;
        break;
        default:
            sBodyHtml = bodyHtml;
        break;
    }

    var h = WYMeditor.Helper;

    //construct the dialog
    var dialogHtml = this._options.dialogHtml;
    dialogHtml = h.replaceAll(dialogHtml, WYMeditor.BASE_PATH, this._options.basePath);
    dialogHtml = h.replaceAll(dialogHtml, WYMeditor.DIRECTION, this._options.direction);
    dialogHtml = h.replaceAll(dialogHtml, WYMeditor.DIALOG_TITLE, this.encloseString( dialogType ));
    dialogHtml = h.replaceAll(dialogHtml, WYMeditor.DIALOG_BODY, sBodyHtml);
    dialogHtml = h.replaceAll(dialogHtml, WYMeditor.INDEX, this._index);

    dialogHtml = this.replaceStrings(dialogHtml);
    dialogTitle = dialogType.replace("_", " ");
        
    $wym_dialog = $.create_modal_dialog(dialogTitle, dialogHtml);    
    modal_dialog = $wym_dialog.data('modal_dialog');
    modal_dialog.open();

    WYMeditor.INIT_DIALOG(this._index);

    return modal_dialog;
};

WYMeditor.editor.prototype.modal_dialog = function(wym)
{
    $('.wym_tools a').click(function(){
        //savedSelection = rangy.saveRestore.saveSelection();
    });
};

/*
Plugin for all dialogs to use to close the window.

Set a really short time out, it seems to need this otherwise it won't close
after updating the HTML in the editor window.
*/
jQuery.fn.closeDialog = function(){

    //rangy.saveRestore.restoreSelection(savedSelection);
    
    setTimeout({
        run: function() {
            modal_dialog.close();
        }
    }.run, 250);
};

WYMeditor.INIT_DIALOG = function(index) 
{
    var wym = WYMeditor.INSTANCES[index];
    var doc = window.document;
    var selected = wym.selected();
    var dialogType = jQuery(wym._options.dialogTypeSelector).val();
    var sStamp = wym.uniqueStamp();
    
    switch(dialogType) 
    {
        case WYMeditor.DIALOG_LINK:
            //ensure that we select the link to populate the fields
            if(selected && selected.tagName && selected.tagName.toLowerCase != WYMeditor.A)
            selected = jQuery(selected).parentsOrSelf(WYMeditor.A);

            //fix MSIE selection if link image has been clicked
            if(!selected && wym._selected_image)
            selected = jQuery(wym._selected_image).parentsOrSelf(WYMeditor.A);
        break;
        default:
        break;
    }

    //pre-init functions
    if(jQuery.isFunction(wym._options.preInitDialog))
    {
        wym._options.preInitDialog(wym,window);
    }

    //add css rules from options
    var styles = doc.styleSheets[0];
    var aCss = eval(wym._options.dialogStyles);

    wym.addCssRules(doc, aCss);

    //auto populate fields if selected container (e.g. A)
    if(selected) 
    {
        jQuery('.wym_css_class', doc).val(jQuery(selected).attr('class'));
        jQuery('.wym_rel', doc).val(jQuery(selected).attr('rel'));
        
        jQuery(wym._options.hrefSelector).val(jQuery(selected).attr(WYMeditor.HREF));
        jQuery(wym._options.srcSelector).val(jQuery(selected).attr(WYMeditor.SRC));
        jQuery(wym._options.titleSelector).val(jQuery(selected).attr(WYMeditor.TITLE));
        jQuery(wym._options.altSelector).val(jQuery(selected).attr(WYMeditor.ALT));
    }
    
    // Bind the same action to all Cancel buttons
    jQuery(wym._options.cancelSelector, doc).click(function(){
        jQuery().closeDialog();
    });

    // Handle Links
    jQuery(wym._options.dialogLinkSelector +" "+ wym._options.submitSelector).submit(function(e){
         e.preventDefault();
         
         var sUrl = jQuery(wym._options.hrefSelector, doc).val();

         if(sUrl.length > 0)
         {            
            var link;

            if (selected[0] && selected[0].tagName.toLowerCase() == WYMeditor.A) {
                link = selected;
            } else {
                wym._exec(WYMeditor.CREATE_LINK, sStamp);
                link = jQuery("a[href=" + sStamp + "]", wym._doc.body);
            }

            link.attr(WYMeditor.HREF, sUrl).attr(WYMeditor.TITLE, jQuery(wym._options.titleSelector).val()).attr('class', jQuery('.wym_css_class').val()).attr('rel', jQuery('.wym_rel').val());
         }
         
         jQuery().closeDialog();
     });

    //auto populate image fields if selected image
    if(wym._selected_image) 
    {
        jQuery(wym._options.dialogImageSelector + " " + wym._options.srcSelector).val(jQuery(wym._selected_image).attr(WYMeditor.SRC));
      
        jQuery(wym._options.dialogImageSelector + " " + wym._options.titleSelector).val(jQuery(wym._selected_image).attr(WYMeditor.TITLE));
      
        jQuery(wym._options.dialogImageSelector + " " + wym._options.altSelector).val(jQuery(wym._selected_image).attr(WYMeditor.ALT));
    }


    jQuery(wym._options.dialogImageSelector +" "+ wym._options.submitSelector).submit(function(e) {
        e.preventDefault();
        
        var sUrl = jQuery(wym._options.srcSelector).val();

        if(sUrl.length > 0) 
        {
            wym._exec(WYMeditor.INSERT_IMAGE, sStamp);

            jQuery("img[src$=" + sStamp + "]", wym._doc.body).attr(WYMeditor.SRC, sUrl).attr(WYMeditor.TITLE, jQuery(wym._options.titleSelector).val()).attr(WYMeditor.ALT, jQuery(wym._options.altSelector).val());
        }
    
        jQuery().closeDialog();
    });

    jQuery(wym._options.dialogTableSelector +" "+ wym._options.submitSelector).submit(function(e) {
        e.preventDefault();

        var iRows = jQuery(wym._options.rowsSelector).val();
        var iCols = jQuery(wym._options.colsSelector).val();

        if(iRows > 0 && iCols > 0) 
        {
            var table = wym._doc.createElement(WYMeditor.TABLE);
            var newRow = null;
            var newCol = null;

            var sCaption = jQuery(wym._options.captionSelector).val();

            //we create the caption
            var newCaption = table.createCaption();
            newCaption.innerHTML = sCaption;

            //we create the rows and cells
            for(x=0; x<iRows; x++) {
                newRow = table.insertRow(x);
                for(y=0; y<iCols; y++) {newRow.insertCell(y);}
            }

            //set the summary attr
            jQuery(table).attr('summary', jQuery(wym._options.summarySelector).val());

            //append the table after the selected container
            var node = jQuery(wym.findUp(wym.container(), WYMeditor.MAIN_CONTAINERS)).get(0);
            if(!node || !node.parentNode)
            {
                jQuery(wym._doc.body).append(table);
            }
            else
            {
                jQuery(node).after(table);
            } 
        }
        
        jQuery().closeDialog();
    });

    jQuery(wym._options.dialogPasteSelector +" "+ wym._options.submitSelector).submit(function(e) {

        e.preventDefault();

        var sText = jQuery(wym._options.textSelector).val();
        wym.paste(sText);
        
        jQuery().closeDialog();
    });

    /* Removed this option, it's useless 
    jQuery(wym._options.dialogPreviewSelector +" "+ wym._options.previewSelector).click(function(){
        wym_dialog.html(wym.xhtml());
    });
    */
    
    //pre-init functions
    if(jQuery.isFunction(wym._options.postInitDialog))
    wym._options.postInitDialog(wym,window);

};




// Custom Dialogs

var wym_dialogLinkHtml = "<div class='wym_dialog wym_dialog_link'><form>"
    + "<fieldset>"
    + "<input type='hidden' class='wym_dialog_type' value='"+ WYMeditor.DIALOG_LINK + "' />"
    
    + "<div class='row'>"
    + "<label>{URL}</label>"
    + "<input type='text' class='wym_href' value='' size='40' />"
    + "</div>"
    
    + "<div class='row'>"
    + "<label>{Title}</label>"
    + "<input type='text' class='wym_title' value='' size='40' />"
    + "</div>"

    + "<div class='row'>"
    + "<label>CSS Class</label>"
    + "<input type='text' class='wym_css_class' value='' size='40' />"
    + "</div>"

    + "<div class='row'>"
    + "<label>Target</label>"
    + "<select class='wym_rel'>"
       + "<option value=''>Same Window</option>"
       + "<option value='_blank'>New Window</option>"
    + "</select>"
    + "</div>"

    + "<div class='row row-indent'>"
    + "<input class='wym_submit' type='submit' value='{Submit}' />"
    + "<input class='wym_cancel' type='button' value='{Cancel}' />"
    + "</div>"
    
    + "</fieldset>"
    + "</form>"
    + "<fieldset class='page_listing' style='display: none;'><legend>Pages</legend><div class='container'>{PAGES_HTML}</div></fieldset>"
    + "</div>";

var wym_dialogImageHtml = "<div class='wym_dialog wym_dialog_image'><form>"
    + "<fieldset>"
    + "<input type='hidden' class='wym_dialog_type' value='"+ WYMeditor.DIALOG_IMAGE +"' />"

    + "<div class='row'>"
    + "<label>{URL}</label>"
    + "<input type='text' class='wym_src' value='' size='40' />"
    + "</div>"

    + "<div class='row'>"
    + "<label>{Alternative_Text}</label>"
    + "<input type='text' class='wym_alt' value='' size='40' />"
    + "</div>"

    + "<div class='row'>"
    + "<label>{Title}</label>"
    + "<input type='text' class='wym_title' value='' size='40' />"
    + "</div>"
    
    + "<div class='row row-indent'>"
    + "<input class='wym_submit' type='submit' value='{Submit}' />"
    + "<input class='wym_cancel' type='button' value='{Cancel}' />"
    + "</div>"
    
    + "</fieldset>"
    + "</form>";

var wym_dialogTableHtml = "<div class='wym_dialog wym_dialog_table'><form>"
    + "<fieldset>"
    + "<input type='hidden' class='wym_dialog_type' value='"+ WYMeditor.DIALOG_TABLE +"' />"

    + "<div class='row'>"
    + "<label>{Caption}</label>"
    + "<input type='text' class='wym_caption' value='' size='40' />"
    + "</div>"

    + "<div class='row'>"
    + "<label>{Summary}</label>"
    + "<input type='text' class='wym_summary' value='' size='40' />"
    + "</div>"

    + "<div class='row'>"
    + "<label>{Number_Of_Rows}</label>"
    + "<input type='text' class='wym_rows' value='3' size='3' />"
    + "</div>"

    + "<div class='row'>"
    + "<label>{Number_Of_Cols}</label>"
    + "<input type='text' class='wym_cols' value='2' size='3' />"
    + "</div>"

    + "<div class='row row-indent'>"
    + "<input class='wym_submit' type='submit' value='{Submit}' />"
    + "<input class='wym_cancel' type='button' value='{Cancel}' />"
    + "</div>"
    
    + "</fieldset>"
    + "</form>";

var wym_dialogPasteHtml = "<div class='wym_dialog wym_dialog_paste'><form>"
    + "<fieldset>"
    + "<input type='hidden' class='wym_dialog_type' value='"+ WYMeditor.DIALOG_PASTE +"' />"
    
    + "<div class='row'>"
    + "<textarea class='wym_text' rows='10' cols='50'></textarea>"
    + "</div>"
    
    + "<div class='row row-indent'>"
    + "<input class='wym_submit' type='submit' value='{Submit}' />"
    + "<input class='wym_cancel' type='button' value='{Cancel}' />"
    + "</div>"
    
    + "</fieldset>"
    + "</form>";

var wym_dialogPreviewHtml = "<div class='wym_dialog wym_dialog_preview'><div>";

})(jQuery);
