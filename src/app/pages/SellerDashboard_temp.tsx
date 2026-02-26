// This is a temporary file to hold the new invoice template
const newInvoiceTemplate = `
      <div style="all: initial; display: block; background: #FFFFFF; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #000000; width: 794px; box-sizing: border-box;">
        
        <!-- Premium Header -->
        <div style="all: initial; display: block; background: linear-gradient(135deg, #2C1810 0%, #3D2415 100%); padding: 16px 24px; position: relative; overflow: hidden;">
          <div style="all: initial; display: block; position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: rgba(212, 175, 55, 0.1); border-radius: 50%;"></div>
          
          <div style="all: initial; display: table; width: 100%; margin: 0; position: relative; z-index: 1;">
            <div style="all: initial; display: table-cell; vertical-align: middle; width: 60%;">
              <div style="all: initial; display: flex; align-items: center; gap: 10px;">
                <div style="all: initial; display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); padding: 8px; border-radius: 6px; box-shadow: 0 3px 10px rgba(212, 175, 55, 0.3);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2C1810" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <div style="all: initial; display: inline-block; vertical-align: middle;">
                  <h1 style="all: initial; display: block; color: #F5E6D3; font-size: 24px; margin: 0; font-family: 'Playfair Display', Georgia, serif; font-weight: 700; letter-spacing: 1.8px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">BOI PARA</h1>
                  <p style="all: initial; display: block; color: #D4AF37; margin: 2px 0 0 0; font-size: 9px; font-weight: 600; letter-spacing: 1px;">From College Street to Your Doorstep</p>
                </div>
              </div>
            </div>
            <div style="all: initial; display: table-cell; vertical-align: middle; text-align: right; width: 40%;">
              <div style="all: initial; display: inline-block; background: rgba(245, 230, 211, 0.1); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(212, 175, 55, 0.3);">
                <p style="all: initial; display: block; color: #D4AF37; margin: 0 0 2px 0; font-size: 16px; font-weight: 700; text-align: right; letter-spacing: 1.8px;">INVOICE</p>
                <p style="all: initial; display: block; color: #F5E6D3; margin: 0; font-size: 11px; text-align: right; font-weight: 500;">#\${invoiceNumber}</p>
                <p style="all: initial; display: block; color: #8B6F47; margin: 2px 0 0 0; font-size: 8px; text-align: right;">\${today}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div style="all: initial; display: block; padding: 14px 24px;">

          <!-- Two Column Layout: Seller & Order Info -->
          <div style="all: initial; display: table; width: 100%; margin-bottom: 10px;">
            <div style="all: initial; display: table-row;">
              <!-- Seller Details -->
              <div style="all: initial; display: table-cell; width: 50%; padding-right: 8px; vertical-align: top;">
                <div style="all: initial; display: block; background: linear-gradient(to bottom, #FFF8F0 0%, #FFFFFF 100%); border: 2px solid #8B6F47; border-radius: 6px; padding: 8px; height: 100%; box-sizing: border-box;">
                  <div style="all: initial; display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                    <div style="all: initial; display: inline-block; width: 3px; height: 12px; background: linear-gradient(to bottom, #D4AF37, #8B6F47); border-radius: 2px;"></div>
                    <p style="all: initial; display: block; color: #2C1810; margin: 0; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;">Seller Information</p>
                  </div>
                  <p style="all: initial; display: block; color: #2C1810; margin: 0 0 4px 0; font-size: 14px; font-weight: 700;">\${user?.storeName || user?.name || 'Seller'}</p>
                  <div style="all: initial; display: flex; align-items: flex-start; gap: 4px; margin-bottom: 3px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B6F47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 9px; line-height: 1.3;">College Street, Kolkata - 700073</p>
                  </div>
                  <div style="all: initial; display: flex; align-items: center; gap: 4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B6F47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 9px;">\${user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <!-- Order Details -->
              <div style="all: initial; display: table-cell; width: 50%; padding-left: 8px; vertical-align: top;">
                <div style="all: initial; display: block; background: linear-gradient(to bottom, #FFF8F0 0%, #FFFFFF 100%); border: 2px solid #8B6F47; border-radius: 6px; padding: 8px; height: 100%; box-sizing: border-box;">
                  <div style="all: initial; display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                    <div style="all: initial; display: inline-block; width: 3px; height: 12px; background: linear-gradient(to bottom, #D4AF37, #8B6F47); border-radius: 2px;"></div>
                    <p style="all: initial; display: block; color: #2C1810; margin: 0; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;">Order Information</p>
                  </div>
                  <div style="all: initial; display: block; margin-bottom: 3px;">
                    <span style="all: initial; display: inline; color: #6B5537; font-size: 9px; font-weight: 600;">Order ID:</span>
                    <span style="all: initial; display: inline; color: #2C1810; font-size: 9px; font-weight: 700; margin-left: 4px;">\${order.id}</span>
                  </div>
                  <div style="all: initial; display: block; margin-bottom: 3px;">
                    <span style="all: initial; display: inline; color: #6B5537; font-size: 9px; font-weight: 600;">Payment:</span>
                    <span style="all: initial; display: inline; color: #2C1810; font-size: 9px; font-weight: 700; margin-left: 4px;">\${order.paymentMethod}</span>
                  </div>
                  <div style="all: initial; display: block;">
                    <span style="all: initial; display: inline; color: #6B5537; font-size: 9px; font-weight: 600;">Date:</span>
                    <span style="all: initial; display: inline; color: #2C1810; font-size: 9px; font-weight: 700; margin-left: 4px;">\${order.date}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="all: initial; display: block; background: linear-gradient(135deg, #FFF8F0 0%, #FAF7F2 100%); border-left: 3px solid #D4AF37; padding: 8px; border-radius: 6px; margin-bottom: 10px; box-shadow: 0 1px 6px rgba(139, 111, 71, 0.08);">
            <div style="all: initial; display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
              <div style="all: initial; display: inline-block; width: 3px; height: 12px; background: linear-gradient(to bottom, #D4AF37, #8B6F47); border-radius: 2px;"></div>
              <p style="all: initial; display: block; color: #2C1810; margin: 0; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</p>
            </div>
            <p style="all: initial; display: block; color: #2C1810; margin: 0 0 3px 0; font-size: 13px; font-weight: 700;">\${order.customerName}</p>
            <div style="all: initial; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B6F47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 9px;">\${order.customerPhone}</p>
            </div>
            <div style="all: initial; display: flex; align-items: flex-start; gap: 4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8B6F47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 9px; line-height: 1.4;">\${order.shippingAddress}</p>
            </div>
          </div>

          <!-- Order Items Table -->
          <div style="all: initial; display: block; margin-bottom: 10px; border-radius: 6px; overflow: hidden; border: 2px solid #8B6F47;">
            <table style="all: initial; display: table; width: 100%; border-collapse: collapse; background: #FFFFFF;">
              <thead>
                <tr style="all: initial; display: table-row; background: linear-gradient(135deg, #2C1810 0%, #3D2415 100%);">
                  <th style="all: initial; display: table-cell; color: #F5E6D3; text-align: left; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Book Title</th>
                  <th style="all: initial; display: table-cell; color: #F5E6D3; text-align: center; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; width: 50px;">Qty</th>
                  <th style="all: initial; display: table-cell; color: #F5E6D3; text-align: right; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; width: 90px;">Price</th>
                  <th style="all: initial; display: table-cell; color: #F5E6D3; text-align: right; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; width: 90px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                \${order.items.map((item: any, index: number) => {
                  const title = item.book?.title || item.title;
                  const price = item.book?.price || item.price;
                  const quantity = item.quantity;
                  const itemTotal = price * quantity;
                  const bgColor = index % 2 === 0 ? '#FFFFFF' : '#FFF8F0';
                  return \`
                    <tr style="all: initial; display: table-row; background: \${bgColor};">
                      <td style="all: initial; display: table-cell; color: #2C1810; padding: 6px 10px; font-size: 10px; border-bottom: 1px solid #E5DDD3; font-weight: 600;">\${title}</td>
                      <td style="all: initial; display: table-cell; color: #6B5537; text-align: center; padding: 6px 10px; font-size: 10px; border-bottom: 1px solid #E5DDD3; font-weight: 600;">\${quantity}</td>
                      <td style="all: initial; display: table-cell; color: #6B5537; text-align: right; padding: 6px 10px; font-size: 10px; border-bottom: 1px solid #E5DDD3;">₹\${price}</td>
                      <td style="all: initial; display: table-cell; color: #2C1810; text-align: right; padding: 6px 10px; font-size: 11px; font-weight: 700; border-bottom: 1px solid #E5DDD3;">₹\${itemTotal}</td>
                    </tr>
                  \`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Financial Summary -->
          <div style="all: initial; display: block; margin-left: auto; width: 300px; margin-bottom: 10px;">
            <div style="all: initial; display: block; background: #FFFFFF; border: 2px solid #8B6F47; border-radius: 6px; overflow: hidden;">
              <div style="all: initial; display: block; background: linear-gradient(135deg, #8B6F47 0%, #6B5537 100%); padding: 6px 10px;">
                <p style="all: initial; display: block; color: #F5E6D3; margin: 0; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Payment Summary</p>
              </div>
              <div style="all: initial; display: block; padding: 8px 10px; background: #FFF8F0;">
                <div style="all: initial; display: table; width: 100%; margin-bottom: 6px;">
                  <div style="all: initial; display: table-row;">
                    <div style="all: initial; display: table-cell; color: #6B5537; font-size: 10px; font-weight: 600; padding: 2px 0;">Order Total</div>
                    <div style="all: initial; display: table-cell; color: #2C1810; font-size: 11px; text-align: right; font-weight: 700; padding: 2px 0;">₹\${order.total}</div>
                  </div>
                </div>
                <div style="all: initial; display: table; width: 100%; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px dashed #D4AF37;">
                  <div style="all: initial; display: table-row;">
                    <div style="all: initial; display: table-cell; color: #6B5537; font-size: 10px; font-weight: 600; padding: 2px 0;">Platform Fee (10%)</div>
                    <div style="all: initial; display: table-cell; color: #DC2626; font-size: 11px; text-align: right; font-weight: 700; padding: 2px 0;">- ₹\${platformCommission}</div>
                  </div>
                </div>
                <div style="all: initial; display: block; background: linear-gradient(135deg, #D4AF37 0%, #F4D03F 100%); padding: 10px; border-radius: 5px; box-shadow: 0 3px 10px rgba(212, 175, 55, 0.25);">
                  <div style="all: initial; display: table; width: 100%;">
                    <div style="all: initial; display: table-row;">
                      <div style="all: initial; display: table-cell; color: #2C1810; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px;">Your Earnings</div>
                      <div style="all: initial; display: table-cell; color: #2C1810; font-size: 16px; text-align: right; font-weight: 800;">₹\${sellerPayout}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Terms -->
          <div style="all: initial; display: block; background: linear-gradient(to right, #FFF8F0 0%, #FAF7F2 100%); border: 1px solid #D4AF37; border-radius: 6px; padding: 7px 10px; margin-bottom: 8px;">
            <p style="all: initial; display: block; color: #2C1810; margin: 0 0 4px 0; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Important Notes:</p>
            <p style="all: initial; display: block; color: #6B5537; margin: 0; font-size: 8px; line-height: 1.5;">• Pack items securely and attach invoice inside package • Verify customer details before handover • Earnings transferred within 2-3 days after delivery</p>
          </div>

        </div>

        <!-- Footer -->
        <div style="all: initial; display: block; background: linear-gradient(135deg, #2C1810 0%, #3D2415 100%); padding: 10px 24px; border-top: 2px solid #D4AF37;">
          <p style="all: initial; display: block; color: #8B6F47; font-size: 7px; margin: 0 0 4px 0; text-align: center; font-style: italic;">Computer-generated invoice. No signature required.</p>
          <p style="all: initial; display: block; color: #F5E6D3; font-size: 11px; margin: 0 0 5px 0; font-weight: 700; text-align: center; letter-spacing: 0.8px;">Thank you for being part of BOI PARA!</p>
          <div style="all: initial; display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 5px; border-top: 1px solid rgba(212, 175, 55, 0.3);">
            <div style="all: initial; display: flex; align-items: center; gap: 3px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <p style="all: initial; display: block; color: #D4AF37; font-size: 8px; margin: 0; font-weight: 500;">support@boipara.com</p>
            </div>
            <div style="all: initial; display: flex; align-items: center; gap: 3px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <p style="all: initial; display: block; color: #D4AF37; font-size: 8px; margin: 0; font-weight: 500;">+91 33 1234 5678</p>
            </div>
            <div style="all: initial; display: flex; align-items: center; gap: 3px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <p style="all: initial; display: block; color: #D4AF37; font-size: 8px; margin: 0; font-weight: 500;">www.boipara.com</p>
            </div>
          </div>
        </div>
      </div>
    `;
