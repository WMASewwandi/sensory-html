(function($) {
  
  "use strict";

  // Preloader
  function stylePreloader() {
    $('body').addClass('preloader-deactive');
  }

  // Background Image
  $('[data-bg-img]').each(function() {
    $(this).css('background-image', 'url(' + $(this).data("bg-img") + ')');
  });

  // Off Canvas JS
  var canvasWrapper = $(".off-canvas-wrapper");
  $(".btn-menu").on('click', function() {
    canvasWrapper.addClass('active');
  });
  $(".close-action > .btn-close, .off-canvas-overlay").on('click', function() {
    canvasWrapper.removeClass('active');
  });

  //Responsive Slicknav JS
  $('.main-menu').slicknav({
    appendTo: '.res-mobile-menu',
    closeOnClick: true,
    removeClasses: true,
    closedSymbol: '<i class="fa fa-angle-down"></i>',
    openedSymbol: '<i class="fa fa-angle-up"></i>'
  });

  // Search Box JS
  var searchwrapper = $(".search-box-wrapper");
  $(".btn-search-menu").on('click', function() {
    searchwrapper.addClass('show');
    $("#search-input").focus();
  });
  $(".search-close").on('click', function() {
    searchwrapper.removeClass('show');
  });

  // Global Search Functionality - Handle all search forms
  function handleSearch(searchTerm) {
    if (searchTerm && searchTerm.trim() !== '') {
      // Redirect to shop page with search query parameter (keep search term in input)
      window.location.href = 'shop-left-sidebar?search=' + encodeURIComponent(searchTerm.trim());
    }
  }

  // Clear search functionality
  function clearSearch() {
    // Clear all search inputs
    $('#search').val('');
    $('#search-input').val('');
    // If on shop page, reload without search parameter
    if (window.location.pathname.includes('shop-left-sidebar')) {
      window.location.href = 'shop-left-sidebar';
    }
  }

  // Handle header search form
  $('.header-search-box form').on('submit', function(e) {
    e.preventDefault();
    var searchTerm = $(this).find('#search').val();
    handleSearch(searchTerm);
  });

  // Handle search modal form
  $('.search-box-form-wrap form').on('submit', function(e) {
    e.preventDefault();
    var searchTerm = $(this).find('#search-input').val();
    handleSearch(searchTerm);
    searchwrapper.removeClass('show');
  });

  // Handle search button clicks
  $('.btn-src, .search-button').on('click', function(e) {
    e.preventDefault();
    var form = $(this).closest('form');
    var searchInput = form.find('#search, #search-input');
    var searchTerm = searchInput.val();
    handleSearch(searchTerm);
    if (searchwrapper.hasClass('show')) {
      searchwrapper.removeClass('show');
    }
  });

  // Product Quick View JS
  var quickViewModal = $(".product-quick-view-modal");
  $(".product-action .action-quick-view").on('click', function() {
    quickViewModal.addClass('active');
    $("body").addClass('fix');
  });
  $(".btn-close, .canvas-overlay").on('click', function() {
    quickViewModal.removeClass('active');
    $("body").removeClass('fix');
  });

  // Format price with LKR currency
  function formatPrice(price) {
    if (price === null || price === undefined || price === 0) {
      return 'LKR 0.00';
    }
    return 'LKR ' + parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Load and render sidebar cart items
  function loadSidebarCart() {
    if (typeof CartService === 'undefined') {
      return;
    }
    
    const cart = CartService.getCart();
    const sidebarItemsContainer = $('#sidebar-cart-items');
    const sidebarSubtotalEl = $('#sidebar-cart-subtotal');
    
    if (!sidebarItemsContainer.length) {
      return; // Sidebar cart not on this page
    }
    
    sidebarItemsContainer.empty();
    
    if (cart.length === 0) {
      sidebarItemsContainer.html('<li class="text-center" style="padding: 20px;">Your cart is empty.</li>');
      if (sidebarSubtotalEl.length) {
        sidebarSubtotalEl.text('LKR 0.00');
      }
      return;
    }
    
    let subtotal = 0;
    
    cart.forEach((item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      subtotal += itemTotal;
      
      const itemHtml = `
        <li class="cart-item">
          <div class="cart-img">
            <a href="shop-single-product.html?id=${item.id}">
              <img src="${item.imageURL || item.imageUrl || 'https://www.holoimage.net/images/no-image.jpg'}" alt="${item.name || 'Product'}">
            </a>
          </div>
          <div class="cart-content">
            <h5>
              <a href="shop-single-product.html?id=${item.id}">${item.name || 'Product'}</a>
            </h5>
            <span class="cart-price">${formatPrice(item.price || 0)} × ${item.quantity || 1}</span>
            <div class="cart-item-close">
              <a href="javascript:void(0);" class="remove-sidebar-item" data-product-id="${item.id}">
                <i class="pe-7s-close"></i>
              </a>
            </div>
          </div>
        </li>
      `;
      
      sidebarItemsContainer.append(itemHtml);
    });
    
    if (sidebarSubtotalEl.length) {
      sidebarSubtotalEl.text(formatPrice(subtotal));
    }
  }
  
  // Handle remove item from sidebar cart
  $(document).on('click', '.remove-sidebar-item', function(e) {
    e.preventDefault();
    if (typeof CartService !== 'undefined') {
      const productId = $(this).data('product-id');
      CartService.removeFromCart(productId);
      loadSidebarCart();
      CartService.updateCartCount();
      
      // If on cart page, trigger cart reload
      if ($('#cart-items-container').length) {
        // Trigger custom event to reload cart page
        $(document).trigger('cartUpdated');
        // Fallback: reload after a short delay if event handler doesn't exist
        setTimeout(function() {
          if ($('#cart-items-container').html().includes(productId)) {
            location.reload();
          }
        }, 100);
      }
    }
  });

  // Sidebar Cart JS - Navigate to cart page instead of opening sidebar
  var sidebarCartModal = $(".sidebar-cart-modal");
  $(".cart-icon").on('click', function(e) {
    e.preventDefault();
    window.location.href = '/shop-cart';
  });
  $(".sidebar-cart-content .cart-close").on('click', function() {
    sidebarCartModal.removeClass('sidebar-cart-active');
    $(".sidebar-cart-overlay").removeClass('show');
  });

  // Checkout Toggle Active
  $('.checkout-coupon-active').on('click', function(e) {
    e.preventDefault();
    $('.checkout-coupon-content').slideToggle(1000);
  });

  // Swipper JS

  // Home Two Slider
  var swiper = new Swiper('.home-slider-container', {
    slidesPerView: 1,
    loop: true,
    spaceBetween: 0,
    effect: 'fade',
    fadeEffect: {
      crossFade: true,
    },
  });

  // Gallery Trends Slider
  var swiper = new Swiper('.product-category1-slider-container', {
    slidesPerView: 3,
    slidesPerGroup: 1,
    loop: true,
    spaceBetween : 30,
    breakpoints: {
      1500:{
          slidesPerView : 3
      },

      992:{
          slidesPerView : 3
      },

      768:{
          slidesPerView : 2
      },

      625:{
          slidesPerView : 2,
          spaceBetween : 15,
      },

      0:{
          slidesPerView : 1
      }
    }
  });

  // Category Slider
  var swiper = new Swiper('.category-slider-container', {
    slidesPerView : 6,
    loop: true,
    loopedSlides: 5,
    loopAdditionalSlides: 2,
    speed: 1000,
    spaceBetween : 30,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
      stopOnLastSlide: false,
    },
    allowTouchMove: true,
    watchSlidesProgress: true,
    watchSlidesVisibility: true,
    breakpoints: {
      1200:{
          slidesPerView : 6,
          spaceBetween : 30
      },

      992:{
          slidesPerView : 4,
          spaceBetween : 30
      },

      768:{
          slidesPerView : 3,
          spaceBetween : 30

      },

      576:{
          slidesPerView : 3,
          spaceBetween : 30
      },

      380:{
          slidesPerView : 2,
          spaceBetween : 30
      },

      0:{
          slidesPerView : 2,
          spaceBetween : 30
      }
    }
  });

  // Swipper JS
  var swiper = new Swiper('.product4-slider-container', {
    slidesPerView: 4,
    loop: true,
    spaceBetween : 30,
    autoplay: {
      delay: 4000,
    },
    navigation: {
      nextEl: '.product4-slider-container .swiper-button-next',
      prevEl: '.product4-slider-container .swiper-button-prev',
    },
    breakpoints: {
      1200:{
          slidesPerView : 4
      },

      992:{
          slidesPerView : 3
      },

      768:{
          slidesPerView : 2

      },

      576:{
          slidesPerView : 2
      },

      0:{
          slidesPerView : 1
      }
    }
  });

  var ProductNav = new Swiper('.single-product-nav-slider', {
    spaceBetween: 11,
    slidesPerView: 3,
    freeMode: true,
    navigation: {
      nextEl: '.single-product-nav-slider .swiper-button-next',
      prevEl: '.single-product-nav-slider .swiper-button-prev',
    },
  });

  var ProductThumb = new Swiper('.single-product-thumb-slider', {
    freeMode: true,
    effect: 'fade',
    fadeEffect: {
      crossFade: true,
    },
    thumbs: {
      swiper: ProductNav
    }
  });

  // Gallery Trends Slider
  var swiper = new Swiper('.testimonial-slider-container', {
    slidesPerView: 3,
    slidesPerGroup: 1,
    loop: true,
    spaceBetween : 40,
    breakpoints: {
      1500:{
          slidesPerView : 3,
          spaceBetween : 40
      },

      992:{
          slidesPerView : 3,
          spaceBetween : 30
      },

      768:{
          slidesPerView : 2,
          spaceBetween : 30
      },

      620:{
          slidesPerView : 2,
          spaceBetween : 15,
      },

      0:{
          slidesPerView : 1
      }
    }
  });

  $('.product-tab1-slider').slick({
    dots: false,
    speed: 300,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 520,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });

  $('.testimonial-slider').slick({
    dots: false,
    infinite: true,
    speed: 300,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: true
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });

  // Fancybox Js
  $('.lightbox-image').fancybox();
  // Isotope and data filter
  function isotopePortfolio() {
    var $grid = $('.masonry-grid').isotope({
      itemSelector: '.masonry-item',
      masonry: {
        columnWidth: 1
      }
    })
    // Isotope Masonry
    var $gridMasonry = $('.masonry-style').isotope({
      itemSelector: '.masonry-item'
    })
    // Isotope filter Menu
    $('.portfolio-filter-menu').on( 'click', 'button', function() {
      var filterValue = $(this).attr('data-filter');
      $grid.isotope({ filter: filterValue });
      $gridMasonry.isotope({ filter: filterValue });
      var filterMenuactive = $(".portfolio-filter-menu button");
      filterMenuactive.removeClass('active');
      $(this).addClass('active');
    });
  }
  
  // Images Zoom
  $('.zoom-hover').zoom();

  // Countdown JS
  var now = new Date();
  var day = now.getDate();
  var month = now.getMonth() + 1;
  var year = now.getFullYear() + 1;
  var nextyear = month + '/' + day + '/' + year + ' 07:07:07';

  $('.countdown-timer').countdown({
    date: '1/2/2022 23:59:59', // TODO Date format: 07/27/2017 17:00:00
    offset: +2, // TODO Your Timezone Offset
    day: 'Day',
    days: 'Days',
    hideOnComplete: true
  }, function (container) {
    // Countdown completed
  });

  //Shop review btn
  $(".review-write-btn").on('click', function() {
    $(".product-review-form").toggle('active');
  });

  // Product Qty
  var proQty = $(".pro-qty");
  proQty.append('<a href="#" class="inc qty-btn"><i class="fa fa-plus"></i></a>');
  proQty.append('<a href="#" class= "dec qty-btn"><i class="fa fa-minus"></i></a>');
  $('.qty-btn').on('click', function(e) {
    e.preventDefault();
    var $button = $(this);
    var oldValue = $button.parent().find('input').val();
    if ($button.hasClass('inc')) {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      // Don't allow decrementing below zero
      if (oldValue > 1) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 1;
      }
    }
    $button.parent().find('input').val(newVal);
  });

  // Product Qty
  var proQty2 = $(".pro-qty-style2");
  proQty2.append('<a href="#" class="inc qty-btn"><i class="fa fa-plus"></i></a>');
  proQty2.append('<a href="#" class= "dec qty-btn"><i class="fa fa-window-minimize"></i></a>');
  $('.qty-btn').on('click', function(e) {
    e.preventDefault();
    var $button2 = $(this);
    var oldValue2 = $button2.parent().find('input').val();
    if ($button2.hasClass('inc')) {
      var newVal2 = parseFloat(oldValue2) + 1;
    } else {
      // Don't allow decrementing below zero
      if (oldValue2 > 1) {
        var newVal2 = parseFloat(oldValue2) - 1;
      } else {
        newVal2 = 1;
      }
    }
    $button2.parent().find('input').val(newVal2);
  });

  //Checkout Page Checkbox Accordion
  $("#create_pwd").on("change", function() {
    $(".account-create").slideToggle("100");
  });

  $("#ship_to_different").on("change", function() {
    $(".ship-to-different").slideToggle("100");
  });

  $('.checkout-toggle').on('click', function() {
    $('.open-toggle').slideToggle(1000);
  });

  var checked = $( '.sin-payment input:checked' )
  if(checked){
    $(checked).siblings( '.payment-box' ).slideDown(900);
  };
 $( '.sin-payment input' ).on('change', function() {
    $( '.payment-box' ).slideUp(900);
    $(this).siblings( '.payment-box' ).slideToggle(900);
  });

  //Tippy Tooltip JS
  tippy('.ht-tooltip', {
    inertia: true,
    animation: 'shift-away',
    arrow: true
  });

  // Scroll Top Hide Show
  var varWindow = $(window);
  varWindow.on('scroll', function(){
    if ($(this).scrollTop() > 250) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }

    // Sticky Header
    if($('.sticky-header').length){
      var windowpos = $(this).scrollTop();
      if (windowpos >= 80) {
        $('.sticky-header').addClass('sticky');
      } else {
        $('.sticky-header').removeClass('sticky');
      }
    }
  });

  // Ajax Contact Form JS
  var form = $('#contact-form');
  var formMessages = $('.form-message');

  $(form).submit(function(e) {
    e.preventDefault();
    var formData = form.serialize();
    $.ajax({
        type: 'POST',
        url: form.attr('action'),
        data: formData
    }).done(function(response) {
        // Make sure that the formMessages div has the 'success' class.
        $(formMessages).removeClass('alert alert-danger');
        $(formMessages).addClass('alert alert-success fade show');

        // Set the message text.
        formMessages.html("<button type='button' class='btn-close' data-bs-dismiss='alert'>&times;</button>");
        formMessages.append(response);

        // Clear the form.
        $('#contact-form input,#contact-form textarea').val('');
    }).fail(function(data) {
        // Make sure that the formMessages div has the 'error' class.
        $(formMessages).removeClass('alert alert-success');
        $(formMessages).addClass('alert alert-danger fade show');

        // Set the message text.
        if (data.responseText === '') {
            formMessages.html("<button type='button' class='btn-close' data-bs-dismiss='alert'>&times;</button>");
            formMessages.append(data.responseText);
        } else {
            $(formMessages).text('Oops! An error occurred and your message could not be sent.');
        }
    });
  });

  //Scroll To Top
  $('.scroll-to-top').on('click', function(){
    $('html, body').animate({scrollTop : 0},800);
    return false;
  });

  // Reveal Footer JS
  let revealId = $(".reveal-footer"),
    footerHeight = revealId.outerHeight(),
    windowWidth = $(window).width(),
    windowHeight = $(window).outerHeight(),
    leftFixedHeader = $("header.fixed-left"),
    leftFixedHeaderWidth = leftFixedHeader.innerWidth();

  if (windowWidth > 991 && windowHeight > footerHeight) {
    $(".site-wrapper-reveal").css({
      'margin-bottom': footerHeight + 'px'
    });
  }
  
  
/* ==========================================================================
   When document is loading, do
   ========================================================================== */
  
  // Render Categories
  function renderCategories(categories) {
    const container = $('#categories-container');
    if (!container.length || !categories || categories.length === 0) {
      return;
    }

    // Take first 6 categories for display
    const displayCategories = categories.slice(0, 6);
    const styleClasses = ['thumb-style1', 'thumb-style2', 'thumb-style3'];
    const marginClasses = ['', 'mt-xs-25', 'mt-sm-25'];
    
    container.empty();
    
    displayCategories.forEach((category, index) => {
      const styleClass = styleClasses[index % 3];
      const marginClass = marginClasses[index % 3];
      const categoryImage = `assets/img/category/${(index % 5) + 1}.png`; // Cycle through available images
      
      // const categoryHtml = `
      //   <div class="col-sm-6 col-md-4">
      //     <div class="category-item ${marginClass}">
      //       <div class="thumb ${styleClass}">
      //          <img src="${categoryImage}" alt="${category.name}">
      //         <div class="content">
      //           <div class="contact-info">
      //             <h2 class="title">${category.name}</h2>
      //             <h4 class="price">${category.productCount} Items</h4>
      //           </div>
      //           <a class="btn-link" href="shop-left-sidebar.html?category=${category.id}">Shop Now</a>
      //         </div>
      //       </div>
      //     </div>
      //   </div>
      // `;
      
      const categoryHtml = `
        <div class="col-sm-6 col-md-4">
          <div class="category-item ${marginClass}">
            <div class="thumb ${styleClass}">
              <div class="content">
                <div class="contact-info">
                  <h2 class="title">${category.name}</h2>
                </div>
                <a class="btn-link" href="shop-left-sidebar?category=${category.id}">Shop Now</a>
              </div>
            </div>
          </div>
        </div>
      `;
      container.append(categoryHtml);
    });
  }

  // Render Category Tabs
  function renderCategoryTabs(categories) {
    const tabsContainer = $('#category-tabs');
    if (!tabsContainer.length || !categories || categories.length === 0) {
      return;
    }

    // Take first 3 categories for tabs (plus "All Items")
    const displayCategories = categories.slice(0, 3);
    
    tabsContainer.empty();
    
    // Add "All Items" tab first
    tabsContainer.append(`
      <li class="nav-item" role="presentation">
        <button class="nav-link active" id="all-items-tab" data-bs-toggle="tab" data-bs-target="#our-features" type="button" role="tab" aria-controls="our-features" aria-selected="true">All Items</button>
      </li>
    `);
    
    // Add category tabs (all point to the same tab pane, we'll filter products on click)
    displayCategories.forEach((category, index) => {
      const isLast = index === displayCategories.length - 1;
      const tabId = `category-${category.id}-tab`;
      const marginClass = isLast ? 'mr-0' : '';
      
      const tabHtml = `
        <li class="nav-item" role="presentation">
          <button class="nav-link ${marginClass}" id="${tabId}" data-bs-toggle="tab" data-bs-target="#our-features" type="button" role="tab" aria-controls="our-features" aria-selected="false" data-category-id="${category.id}">${category.name}</button>
        </li>
      `;
      
      tabsContainer.append(tabHtml);
    });
  }

  // Render Products
  function renderProducts(products, containerId = '#products-container') {
    const container = $(containerId);
    if (!container.length || !products || products.length === 0) {
      container.html('<div class="col-12"><p class="text-center">No products found.</p></div>');
      return;
    }

    container.empty();
    
    if (!products || products.length === 0) {
      container.html('<div class="col-12"><p class="text-center">No products found.</p></div>');
      return;
    }
    
    const defaultImage = 'https://www.holoimage.net/images/no-image.jpg';
    
    products.forEach((product) => {
      // Use product image or default image
      const productImage = (product.imageURL && product.imageURL.trim() !== '') ? product.imageURL : defaultImage;
      const productPrice = product.sellingPrice > 0 ? product.sellingPrice : (product.unitPrice > 0 ? product.unitPrice : 0);
      const formattedPrice = formatPrice(productPrice);
      
      // Store product data for cart/wishlist and modal (include description)
      const productData = {
        id: product.id,
        name: product.name,
        imageURL: product.imageURL,
        sellingPrice: product.sellingPrice,
        unitPrice: product.unitPrice,
        description: product.description || ''
      };
      
      const productHtml = `
        <div class="col-lg-3 col-md-4 col-sm-6">
          <!-- Start Product Item -->
          <div class="product-item">
            <div class="product-thumb">
              <img src="${productImage}" alt="${product.name}">
              <div class="product-action">
                <a class="action-quick-view add-to-cart-btn" href="javascript:void(0)" data-product='${JSON.stringify(productData)}'><i class="ion-ios-cart"></i></a>
                <a class="action-quick-view quick-view-btn" href="javascript:void(0)" data-product='${JSON.stringify(productData)}'><i class="ion-arrow-expand"></i></a>
                <a class="action-quick-view add-to-wishlist-btn" href="javascript:void(0)" data-product='${JSON.stringify(productData)}'><i class="ion-heart"></i></a>
              </div>
            </div>
            <div class="product-info">
              <div class="rating">
                <span class="fa fa-star"></span>
                <span class="fa fa-star"></span>
                <span class="fa fa-star"></span>
                <span class="fa fa-star"></span>
                <span class="fa fa-star"></span>
              </div>
              <h4 class="title"><a href="shop-single-product.html?id=${product.id}">${product.name}</a></h4>
              <div class="prices">
                <span class="price">${formattedPrice}</span>
              </div>
            </div>
          </div>
          <!-- End Product Item -->
        </div>
      `;
      
      container.append(productHtml);
    });
  }

  // Helper function to shuffle array (Fisher-Yates algorithm)
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Load and render products
  async function loadProducts(categoryId = null) {
    const container = $('#products-container');
    
    // Show loading state
    container.html('<div class="col-12"><p class="text-center">Loading products...</p></div>');
    
    try {
      // Fetch more products to ensure we have enough with images after filtering
      const result = await fetchProducts(0, 100, categoryId); // Fetch more to get enough products with images
      
      if (result && result.items && result.items.length > 0) {
        let productsToShow = result.items;
        
        // Client-side filtering by categoryId if provided
        if (categoryId) {
          productsToShow = result.items.filter(product => {
            // Compare as strings to ensure matching
            const productCatId = String(product.categoryId || '');
            const filterCatId = String(categoryId || '');
            const matches = productCatId === filterCatId;
            
            return matches;
          });
        }
        
        // Use all products (no image filter - will use default image if needed)
        const defaultImage = 'https://www.holoimage.net/images/no-image.jpg';
        
        if (productsToShow.length === 0) {
          container.html('<div class="col-12"><p class="text-center">No products found.</p></div>');
          return;
        }
        
        // Sort by creation date (descending - newest first)
        // Check for common date field names: creationTime, createdDate, dateCreated, creationDate
        const sortedProducts = productsToShow.sort((a, b) => {
          const dateA = a.creationTime || a.createdDate || a.dateCreated || a.creationDate || a.lastModificationTime || 0;
          const dateB = b.creationTime || b.createdDate || b.dateCreated || b.creationDate || b.lastModificationTime || 0;
          
          // Convert to timestamps if they're strings
          const timestampA = dateA ? new Date(dateA).getTime() : 0;
          const timestampB = dateB ? new Date(dateB).getTime() : 0;
          
          // Sort descending (newest first)
          return timestampB - timestampA;
        });
        
        // Get first 8 products (newest)
        const latestProducts = sortedProducts.slice(0, 8);
        
        // Store all products globally for modal access (with full description)
        window.homeProducts = result.items;
        
        if (latestProducts.length > 0) {
          renderProducts(latestProducts);
        } else {
          container.html('<div class="col-12"><p class="text-center">No products found.</p></div>');
        }
      } else {
        container.html('<div class="col-12"><p class="text-center">No products found.</p></div>');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      container.html('<div class="col-12"><p class="text-center">Error loading products. Please try again later.</p></div>');
    }
  }

  // Load and render categories
  async function loadCategories() {
    try {
      const categories = await fetchCategories();
      if (categories && categories.length > 0) {
        renderCategories(categories);
        renderCategoryTabs(categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  // Handle category tab clicks
  $(document).on('click', '[data-category-id]', function(e) {
    e.preventDefault();
    const $this = $(this);
    const categoryId = $this.data('category-id');
    
    
    // Update active states
    $('#category-tabs .nav-link').removeClass('active');
    $this.addClass('active');
    $this.attr('aria-selected', 'true');
    $('#category-tabs .nav-link').not($this).attr('aria-selected', 'false');
    
    // Load products for this category
    loadProducts(categoryId);
  });

  // Handle "All Items" tab click
  $(document).on('click', '#all-items-tab', function(e) {
    e.preventDefault();
    const $this = $(this);
    
    // Update active states
    $('#category-tabs .nav-link').removeClass('active');
    $this.addClass('active');
    $this.attr('aria-selected', 'true');
    $('#category-tabs .nav-link').not($this).attr('aria-selected', 'false');
    
    // Load all products
    loadProducts(null);
  });

  // Load trending products (10 random products with images)
  async function loadTrendingProducts() {
    const container = $('#trending-products-container');
    if (!container.length) {
      return;
    }
    
    try {
      // Fetch products to get enough with images
      const result = await fetchProducts(0, 100, null);
      
      if (result && result.items && result.items.length > 0) {
        // Use all products (no image filter - will use default image if needed)
        const defaultImage = 'https://www.holoimage.net/images/no-image.jpg';
        
        if (result.items.length === 0) {
          return;
        }
        
        // Shuffle and get 10 random products
        const shuffledProducts = shuffleArray(result.items);
        const randomProducts = shuffledProducts.slice(0, 10);
        
        // Render trending products in slider format
        container.empty();
        
        randomProducts.forEach((product) => {
          const productImage = (product.imageURL && product.imageURL.trim() !== '') ? product.imageURL : defaultImage;
          const productPrice = product.sellingPrice > 0 ? product.sellingPrice : (product.unitPrice > 0 ? product.unitPrice : 0);
          const formattedPrice = formatPrice(productPrice);
          
          // Store product data for cart/wishlist and modal (include description)
          const productData = {
            id: product.id,
            name: product.name,
            imageURL: product.imageURL,
            sellingPrice: product.sellingPrice,
            unitPrice: product.unitPrice,
            description: product.description || ''
          };
          
          const slideItemHtml = `
            <div class="slide-item">
              <!-- Start Product Item -->
              <div class="product-item">
                <div class="product-thumb">
                  <img src="${productImage}" alt="${product.name}">
                  <div class="product-action">
                    <a class="action-quick-view add-to-cart-btn" href="javascript:void(0)" data-product='${JSON.stringify(productData)}'><i class="ion-ios-cart"></i></a>
                    <a class="action-quick-view quick-view-btn" href="javascript:void(0)" data-product='${JSON.stringify(productData)}'><i class="ion-arrow-expand"></i></a>
                    <a class="action-quick-view add-to-wishlist-btn" href="javascript:void(0)" data-product='${JSON.stringify(productData)}'><i class="ion-heart"></i></a>
                  </div>
                </div>
                <div class="product-info">
                  <div class="rating">
                    <span class="fa fa-star"></span>
                    <span class="fa fa-star"></span>
                    <span class="fa fa-star"></span>
                    <span class="fa fa-star"></span>
                    <span class="fa fa-star"></span>
                  </div>
                  <h4 class="title"><a href="shop-single-product.html?id=${product.id}">${product.name}</a></h4>
                  <div class="prices">
                    <span class="price">${formattedPrice}</span>
                  </div>
                </div>
              </div>
              <!-- End Product Item -->
            </div>
          `;
          
          container.append(slideItemHtml);
        });
        
        // Reinitialize slider if needed
        if (typeof $ !== 'undefined' && $.fn.slick) {
          container.slick('unslick');
          container.slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 3000,
            arrows: true,
            dots: false,
            responsive: [
              {
                breakpoint: 992,
                settings: {
                  slidesToShow: 3
                }
              },
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 2
                }
              },
              {
                breakpoint: 576,
                settings: {
                  slidesToShow: 1
                }
              }
            ]
          });
        }
      }
    } catch (error) {
      console.error('Error loading trending products:', error);
    }
  }

  // Handle add to cart clicks
  $(document).on('click', '.add-to-cart-btn', function(e) {
    e.preventDefault();
    const $this = $(this);
    let productData = $this.data('product');
    
    // If data-product is a string, parse it
    if (typeof productData === 'string') {
      try {
        productData = JSON.parse(productData);
      } catch (e) {
        console.error('Error parsing product data:', e);
        return;
      }
    }
    
    if (productData && typeof CartService !== 'undefined') {
      CartService.addToCart(productData);
      
      // Update sidebar cart if it exists
      loadSidebarCart();
      
      // Show feedback
      $this.find('i').addClass('added');
      setTimeout(() => {
        $this.find('i').removeClass('added');
      }, 1000);
    }
  });

  // Handle add to wishlist clicks
  $(document).on('click', '.add-to-wishlist-btn', function(e) {
    e.preventDefault();
    const $this = $(this);
    let productData = $this.data('product');
    
    // If data-product is a string, parse it
    if (typeof productData === 'string') {
      try {
        productData = JSON.parse(productData);
      } catch (e) {
        console.error('Error parsing product data:', e);
        return;
      }
    }
    
    if (productData && typeof WishlistService !== 'undefined') {
      const added = WishlistService.addToWishlist(productData);
      
      if (added) {
        // Show feedback
        $this.find('i').addClass('added');
        setTimeout(() => {
          $this.find('i').removeClass('added');
        }, 1000);
      } else {
        // Already in wishlist
        alert('Product is already in your wishlist!');
      }
    }
  });

  varWindow.on('load', function() {
    isotopePortfolio();
    AOS.init({
      once: true,
    });
    stylePreloader();
    
    // Update cart count on page load
    if (typeof CartService !== 'undefined') {
      CartService.updateCartCount();
      // Load sidebar cart items
      loadSidebarCart();
    }
    
    // Update wishlist count on page load
    if (typeof WishlistService !== 'undefined') {
      WishlistService.updateWishlistCount();
    }
    
    // Load categories and products after page loads
    if (typeof fetchCategories === 'function') {
      loadCategories();
    }
    
    if (typeof fetchProducts === 'function') {
      loadProducts();
      loadTrendingProducts();
    }
  });
  

})(window.jQuery);