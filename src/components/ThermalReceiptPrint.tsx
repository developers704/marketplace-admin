import logo from '@/assets/images/logo.png'
import orderPets from "@/assets/images/orderPets.png"
import orderReview from "@/assets/images/orderReview.png"
import orderShippingPolicy from "@/assets/images/orderShippingPolicy.png"
import orderRefundPolicy from "@/assets/images/orderRefund.png"
import orderExchangePolicy from "@/assets/images/orderExchangePolicy.png"
import orderContact from "@/assets/images/orderContact.png"
import React from 'react'

const ThermalReceiptPrint = ({ order }: { order: any }) => {
    if (!order) return null;
    // Create a reference for print container
    const printRef = React.useRef<any>(null);
    // Function to handle print preview
    const handlePrint = () => {
        if (printRef.current) {
            const printWindow = window.open('', '', 'width=800,height=600');
            if (printWindow) {
                printWindow.document.write(`
                 <html>
                     <head>
                         <title>Print Receipt</title>
                          <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet">
                         <style>
                             @page {
                                 size: 90mm auto;  /* Width: 80mm, Height: auto */
                                 margin: 0;
                             }
                             body {
                                 width: 90mm;
                                 margin: 0;
                                 padding: 0;
                             }
                             .receipt-container {
                                 width: 100%;
                             }
                         </style>
                     </head>
                     <body>
                         ${printRef.current.innerHTML}
                     </body>
                 </html>
             `);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }
        }
    };
    return (
        <div className="flex flex-col items-center">
            {/* Preview container with exact dimensions */}
            <div className="relative mb-4">
                <div className="absolute top-0 left-0 w-[90mm] h-2 bg-gray-300"></div>
                <div className="absolute top-0 right-0 w-2 h-full bg-gray-300"></div>
                <div className="absolute bottom-0 left-0 w-[90mm] h-2 bg-gray-300"></div>
                <div className="absolute top-0 left-0 w-2 h-full bg-gray-300"></div>
                <p className="absolute -top-6 left-0 text-sm text-gray-500">90mm</p>
            </div>

            {/* Actual receipt content */}
            <div
                ref={printRef}
                className="w-[90mm] mx-auto text-sm font-sans bg-white"
                style={{
                    width: '90mm',
                    boxSizing: 'border-box'
                }}
            >
                <div className='relative border-2 border-black'>
                    <div className="absolute left-0 top-0 w-24 h-24 overflow-hidden">
                        <div className="absolute -rotate-45 bg-orange-400 text-black text-sm font-bold shadow-md w-28 text-center py-1 -left-6 top-5">
                            UNPAID
                        </div>
                    </div>
                    <div className="text-center mb-2 mt-2">
                        <img src={logo} alt="logo" className="h-12 mx-auto" />
                        <div className="">
                            <h1 className="font-sans font-bold">MY PET HOSPITAL</h1>
                        </div>
                        <h1 className="font-bold font-sans">CONTACT NO. 0333-2711606</h1>
                        <div className="text-xs flex justify-center gap-2">
                            <span className="flex items-center">
                                <i className="ri-global-line mr-1"></i>
                                www.mypethospital.pk
                            </span>
                            <span className="flex items-center">
                                <i className="ri-mail-line mr-1"></i>
                                info@mypethospital.pk
                            </span>
                        </div>
                    </div>

                    {/* Sale Receipt Title */}
                    <div className="text-center border-t-2 border-b-2 border-black w-full py-1 mb-4">
                        <h2 className="font-bold text-xl font-sans">SALE RECEIPT</h2>
                    </div>


                    {/* Order Details */}
                    <div className="flex justify-between mb-4">
                        <div className='text-xs pl-1'>
                            <div>Invoice No. {order?.orderId || 'N/A'}</div>
                            <div>Operator Name: {order?.operator || 'Saad Noor'}</div>
                            <div>Invoice Date: {new Date(order?.createdAt || '').toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div>Customer Name: {order?.customer?.username || 'N/A'}</div>
                            <div>Customer Number: {order?.customer?.phone_number || 'N/A'}</div>
                            <div>Customer Email: {order?.customer?.email || 'N/A'}</div>
                            <div>Payment Status: {order?.paymentMethod || 'Cash on Delivery'}</div>
                        </div>

                        <div className="flex flex-col font-sans justify-between mb-4">
                            <div className="text-xs">
                                <h2 className='font-bold mb-1'>Address Detail:</h2>
                                <div className="font-bold">Bill From:</div>
                                <div>My Pet Hospital</div>
                            </div>
                            <div className="text-xs">
                                <div className="font-bold">Shipping To:</div>
                                <div>{order?.shippingAddress?.address || 'N/A'}</div>
                                <div>{order?.city?.name || 'N/A'}</div>
                            </div>
                        </div>
                    </div>



                    {/* Items Table */}
                    <div className="mb-1 px-1">
                        <div className="flex text-xs font-bold border-2 border-black">
                            <div className="w-48 border-r border-black p-1">Item Name</div>
                            <div className="w-16 text-center border-r border-black p-1">Price</div>
                            <div className="w-20 text-center border-r border-black p-1">Qty</div>
                            <div className="w-16 text-center border-r border-black p-1">Disc%</div>
                            <div className="w-20 text-center p-1">Amount</div>
                        </div>
                        {order?.items?.map((item: any, index: number) => (
                            <div key={index} className="flex text-xs border-2 border-black">
                                <div className="w-48 border-r border-black p-1 break-words">
                                    {item?.product?.name || 'N/A'} [{item?.product?.sku || 'N/A'}]
                                </div>
                                <div className="w-16 text-center border-r border-black p-1">{item?.price || 0}</div>
                                <div className="w-20 text-center border-r border-black p-1">{item?.quantity || 0}</div>
                                <div className="w-16 text-center border-r border-black p-1">00.00%</div>
                                <div className="w-20 text-center p-1">{(item?.quantity || 0) * (item?.price || 0)}</div>
                            </div>
                        ))}
                    </div>


                    {/* Totals */}
                    <div className="">
                        <div className="flex justify-between text-xs mb-1 border-t-2 border-b-2 border-black py-1">
                            <div className="flex-1 pl-3">Total Items: {order?.items?.length || 0}</div>
                            <div className="w-16"></div>
                            <div className="w-20 text-left pl-1">Total Qty: {order?.items?.reduce((sum: number, item: any) => sum + (item?.quantity || 0), 0) || 0}</div>
                            <div className="w-20"></div>
                        </div>
                        <div className="flex">
                            {/* QR Code Section */}
                            <div className="w-1/2 flex flex-col items-center justify-center py-1">
                                <img src={orderReview} alt="Scan QR" className="w-24 h-24" />
                                <h2 className='text-center font-sans font-semibold pt-1'>SCAN TO DROP YOUR REVIEW</h2>
                            </div>

                            {/* Totals and Rewards Section */}
                            <div className="w-1/2">
                                {/* Totals */}
                                <div className="flex justify-between text-xs mb-1 py-1">
                                    <div className="font-semibold">Total Amount</div>
                                    <div className="border-b-2 border-black px-1 font-bold">$  {order?.grandTotal || 0}</div>
                                </div>

                                {/* Rewards Message */}
                                <div className="flex items-center mt-4">
                                    <div className="text-xs text-center font-sans font-bold">
                                        Feed Your Pets, Earn Rewards<br />
                                        Refer a Friend and Get 200 Loyalty Points!
                                    </div>
                                    <img src={orderPets} alt="Pets" className="w-14 h-16 mr-2" />
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* MemberShips Point Details */}
                    <div className="">
                        <div className="text-center border-t-2 border-black w-full py-2">
                            <h2 className="font-bold">MEMBERSHIP POINT DETAILS</h2>
                        </div>

                        <div className="grid grid-cols-4 text-xs ">
                            {/* Table Headers */}
                            <div className="border-2 border-black p-2 text-center font-semibold">Opening Balance</div>
                            <div className="border-2 border-black p-2 text-center font-semibold">Less Points, Redeemed</div>
                            <div className="border-2 border-black p-2 text-center font-semibold">Loyalty Points Earned</div>
                            <div className="border-2 border-black p-2 text-center font-semibold">Closing Balance</div>

                            {/* Table Data */}
                            <div className="border-2 border-black p-2 text-center">0</div>
                            <div className="border-2 border-black p-2 text-center">0</div>
                            <div className="border-2 border-black p-2 text-center">0</div>
                            <div className="border-2 border-black p-2 text-center">0</div>
                        </div>
                    </div>


                    {/* Terms and Conditions */}
                    <div>
                        <div className="text-center border-b-2 border-black py-2">
                            <h2 className="font-bold">TERMS AND CONDITION</h2>
                        </div>
                        <div className="grid grid-cols-3 text-xs">
                            <div className="border-r border-black">
                                <div className="font-semibold border-b-2 border-black py-1 mb-2 text-center">Shipping Policy</div>
                                <div className="flex justify-center pb-2">
                                    <img src={orderShippingPolicy} alt="Shipping Policy" className="w-16 h-16" />
                                </div>
                            </div>

                            <div className="border-r border-black">
                                <div className="font-semibold border-b-2 border-black py-1 mb-2 text-center">Return Policy</div>
                                <div className="flex justify-center pb-2">
                                    <img src={orderExchangePolicy} alt="Exchange Policy" className="w-16 h-16" />
                                </div>
                            </div>

                            <div>
                                <div className="font-semibold border-b-2 border-black py-1 mb-2 text-center">Refund Policy</div>
                                <div className="flex justify-center pb-2">
                                    <img src={orderRefundPolicy} alt="Refund Policy" className="w-16 h-16" />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Order More Details  */}
                    <div className="flex mb-4 text-[10px] border-t-2 border-black pt-2">
                        {/* Left Column - Order Details */}
                        <div className="w-1/2 pl-2">
                            <div>Order Date: {new Date(order.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            <div>Order Time: {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                            <div>Invoice Date: {new Date().toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div>Print Date: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            <div>Print Time: {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} </div>

                        </div>

                        {/* Right Column - Additional Details */}
                        <div className="w-1/2 pl-2 flex flex-col">
                            {/* Contact Scanner Section */}
                            <div className="flex items-center mb-2">
                                <img src={orderContact} alt="Contact Scanner" className="w-12 h-12 mr-2" />
                                <div className="text-[10px]">
                                    Scan to Contact Customer Care Deptt: on WhatsApp directly
                                </div>
                            </div>

                            {/* Note Section */}
                            <div className="text-[10px] flex flex-col">
                                <span className='font-bold'>Note:</span>
                                <span>This is a computer-generated receipt; no need for a signature.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}

                    <div className="border-t-2 border-black py-1 text-[8px]">
                        <p className='text-center text-[8px] font-bold'>Thank you for shopping with My Pet Hospital - we're grateful to have you as part of our family!</p>
                    </div>
                </div>
            </div>
            <button
                onClick={handlePrint}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Print Preview (80mm)
            </button>
        </div>
    );
};

export default ThermalReceiptPrint;