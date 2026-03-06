export function extractSkuCodes(jsonData: any) {

    const resultList: any[] = [];

    if (jsonData?.data && jsonData.data.length > 0) {

        jsonData.data.forEach((order: any) => {

            order?.orderLines?.forEach((orderLine: any) => {

                if (orderLine?.subItems && orderLine.subItems.length > 0) {

                    orderLine.subItems.forEach((subItem: any) => {
                        resultList.push({
                            sku: subItem.sku,
                            seller: subItem.sellerCode,
                            product_id: subItem.adminProductId,
                            reservedQuantity: subItem.quantity,
                            sellerCodeLength: subItem.sellerCode
                                ? subItem.sellerCode.length
                                : 0
                        });
                    });

                } else {

                    resultList.push({
                        sku: orderLine.sku,
                        seller: orderLine.sellerCode,
                        product_id: orderLine.adminProductId,
                        reservedQuantity: orderLine.quantity,
                        sellerCodeLength: orderLine.sellerCode
                            ? orderLine.sellerCode.length
                            : 0
                    });

                }

            });

        });

    }

    return resultList;
}