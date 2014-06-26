/* Author: Hu Zhang */
(function($){
  $.imgcrop_init = function(){
      $('[data-provides="imgcrop"]').each(function(){
      var dp = $('[data-provides^="' + $(this).attr('id') + '_can"]').attr('data-provides');
      var matched = dp.match(/pre_(\d+)_(\d+)/);
      var options = {
        imageWrapper: '[data-provides^="' + $(this).attr('id') + '_img"]',
        canvasWrapper: '[data-provides^="' + $(this).attr('id') + '_can"]',
        cancelButton: '[data-provides="' + $(this).attr('id') + '_remove"]',
        chooseImageButton: '[data-provides="' + $(this).attr('id') + '_select"]'
      };
      if(matched){
        options.can_previewWidth = parseInt(matched[1]);
        options.can_previewHeight = parseInt(matched[2]);
      }
      matched = dp.match(/sub_(\d+)_(\d+)/);
      if(matched){
        options.can_submitWidth = parseInt(matched[1]);
        options.can_submitHeight = parseInt(matched[2]);
      }
      
      dp = $('[data-provides^="' + $(this).attr('id') + '_img"]').attr('data-provides');
      matched = dp.match(/size_(\d+)_(\d+)/);
      if(matched){
        options.img_max_width = matched[1] + 'px';
        options.img_max_height = matched[2] + 'px';
      }
      $(this).imgcrop(options);
    });
  }

  $.fn.imgcrop = function(options){
    var $this = this;
    var field_name = $this.attr('name');
    $this.attr('data-provides','imgcrop_attached');
        //defaults
    $this.options = {
      imageWrapper:options.imageWrapper,
      canvasWrapper:options.canvasWrapper,
      
      chooseImageButton:options.chooseImageButton,
      cancelButton:options.cancelButton,
      
      
      img_max_width : '300px',
      img_max_height : '200px',
      
      can_previewWidth:300,
      can_previewHeight:200,
      
      can_submitWidth : 600,
      can_submitHeight : 400
    }
    
    //passed in
    for(var k in options){
      $this.options[k] = options[k];
    }
    
    
    
    
    
    $this.jcrop_api = null;
    
    $this.img = null;
    
    $this.canvas_preview = null;
    $this.canvas_submit = null;
    $this.hiddenInput = null;
    
    
    
    
    $this.cancelButton = $(options.cancelButton);
    
    $this.chooseImageButton = $(options.chooseImageButton);

    $this.hide();
    $this.cancelButton.hide();
    
    $this.chooseImageButton.click(function(){
      $this.trigger('click');
    });
    
    $this.destroy = function(){
      $this.cancelButton.hide();
      if($this.hiddenInput){
        $this.hiddenInput.remove();
      }
      $this.hiddenInput = null;
      if($this.jcrop_api){
        $this.jcrop_api.destroy();
      }
      $($this.options.imageWrapper).html('');
      $($this.options.canvasWrapper).html('');
      $this.attr('name',field_name);
      $this.val('');
      $this.jcrop_api = null;
      $this.img = null;
      $this.canvas_preview = null;
      $this.canvas_submit = null;
      //$this.attr('data-provides','imgcrop');
    }
    
    $this.cancelButton.click(function(){
        $this.destroy();
        $this.cancelButton.hide();
    });
    
    var IMGCROP = function(image,canvas){
        var c_width = canvas[0].width;
        var c_height = canvas[0].height;
        var img_w = image.naturalWidth;
        var img_h = image.naturalHeight;
        var r_w = 0.0;
        var r_h = 0.0;
        var r_x = 0;
        var r_y = 0;
        var r_ratio = c_width/c_height;
        if(img_w >= img_h){
          r_w = img_h * r_ratio;
          r_h = img_h;
          r_x = img_w / 2 - r_w / 2; 
        }else{
          r_w = img_w;
          r_h = img_w / r_ratio;
          r_y = img_h / 2 - r_h / 2;
        }

        var jcrop_api = $.Jcrop($(image),{
          onChange:   drawToCanvas,
          onSelect:   drawToCanvas,
          onRelease:  reselect,
          aspectRatio: r_ratio,
          setSelect: [r_x,r_y,r_w,r_h],
          trueSize: [img_w,img_h]
        });
        function drawToCanvas(c){
          for(var i in canvas){
            var can = canvas[i];
            var ctx = can.getContext('2d');
            can.width = can.width;
            can.height = can.height;
            ctx.scale(can.width/c.w,can.height/c.h);
            ctx.drawImage(image,c.x,c.y,c.w,c.h,0,0,c.w,c.h);
          }
		  $this.hiddenInput.val(canvas[canvas.length-1].toDataURL('image/png'));
        }
        function reselect(){
          jcrop_api.setSelect([r_x,r_y,r_w,r_h]);
        }
      return jcrop_api;
    }
  
    $this.change(function(){
      if($(this).val()){
        var file = this.files[0];
        if(!(/image\/\w+/.test(file.type))){
          this.value = '';
          $this.destroy();
          alert('The file you chose is not an image');
          return false;
        }
        $this.removeAttr('name');
        
        if(!$this.hiddenInput){
          $this.hiddenInput = $('<input>',{
            type:'hidden',
            name:field_name,
            value:''
          });
          $this.after($this.hiddenInput);
        }
        
        

        $this.cancelButton.show();
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(){
          if($this.jcrop_api){
            $this.jcrop_api.destroy();
          }
          var _src = this.result;
          $this.img = $('<img>',{
            css:{
              'max-width':$this.options.img_max_width,
              'max-height':$this.options.img_max_height
            },
            src:_src
          });

          $($this.options.imageWrapper).html($this.img);

          if(!$this.canvas_preview){
            $this.canvas_preview = 
              $('<canvas>')
                .attr('width',$this.options.can_previewWidth)
                .attr('height',$this.options.can_previewHeight);
            $this.canvas_submit = 
              $('<canvas>')
                .css('display','none')
                .attr('width',$this.options.can_submitWidth)
                .attr('height',$this.options.can_submitHeight);
            $($this.options.canvasWrapper).html($this.canvas_preview);
            $($this.options.canvasWrapper).append($this.canvas_submit);
          }
          
          $this.img[0].onload = function(){
            $this.jcrop_api = IMGCROP(this,[$this.canvas_preview[0],$this.canvas_submit[0]]);
          };
        }
      }
    });
    return this;
  }
}(jQuery));
jQuery(document).ready(jQuery.imgcrop_init);