from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from .models import Supplier, Product, Inventory_Transaction
from .serializers import SupplierSerializer, ProductSerializer, InventoryTransactionSerializer
import pandas as pd
from django.utils import timezone

class CSVUploadView(APIView):
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_csv(file)
            success_count = 0

            for index, row in df.iterrows():
                supplier_val = row.get('Supplier_Name') if 'Supplier_Name' in df.columns else row.get('Supplier')
                if pd.isna(row.get('Product_Name')) or pd.isna(supplier_val):
                    continue

                supplier_name = str(supplier_val).strip()
                product_name = str(row['Product_Name']).strip()
                category = str(row.get('Category', '')).strip()
                
                try:
                    price = float(row.get('Price', 0))
                    quantity = int(row.get('Quantity_In_Stock', 0))
                except ValueError:
                    continue

                phone_val = row.get('Phone') if 'Phone' in df.columns else row.get('Contact')
                phone = str(phone_val).strip() if not pd.isna(phone_val) else 'N/A'
                
                street_val = row.get('Street')
                street = str(street_val).strip() if not pd.isna(street_val) else 'N/A'
                
                city_val = row.get('City')
                city = str(city_val).strip() if not pd.isna(city_val) else 'N/A'
                
                state_val = row.get('State')
                state = str(state_val).strip() if not pd.isna(state_val) else 'N/A'
                
                pincode_val = row.get('Pincode')
                pincode = str(pincode_val).strip() if not pd.isna(pincode_val) else 'N/A'

                # 1. Manually handle Supplier to guarantee it is saved with a PK
                supplier = Supplier.objects.filter(Supplier_Name=supplier_name).first()
                if not supplier:
                    supplier_id = Supplier.objects.count() + 1
                    supplier = Supplier(
                        Supplier_ID=supplier_id,
                        Supplier_Name=supplier_name,
                        Phone=phone, 
                        Street=street, 
                        City=city, 
                        State=state, 
                        Pincode=pincode
                    )
                    supplier.save()

                # 2. Manually handle Product
                product = Product.objects.filter(Product_Name=product_name, Supplier=supplier).first()
                if not product:
                    product_id = Product.objects.count() + 101
                    product = Product(
                        Product_ID=product_id,
                        Product_Name=product_name,
                        Category=category,
                        Price=price,
                        Quantity_In_Stock=quantity,
                        Supplier=supplier
                    )
                    product.save()
                else:
                    # 3. If Product exists, update stock
                    product.Quantity_In_Stock = product.Quantity_In_Stock + quantity
                    product.save()

                # 4. Automatically log "IN" transaction
                if quantity > 0:
                    transaction_id = Inventory_Transaction.objects.count() + 1
                    transaction = Inventory_Transaction(
                        Transaction_ID=transaction_id,
                        Transaction_Type='IN',
                        Quantity=quantity,
                        Total_Value=float(quantity * price),
                        Product=product
                    )
                    transaction.save()

                success_count = success_count + 1

            message = "Successfully processed " + str(success_count) + " records."
            return Response({"message": message}, status=status.HTTP_200_OK)

        except Exception as e:
            error_message = "An error occurred: " + str(e)
            return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class SupplierListView(generics.ListAPIView):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

class TransactionListView(generics.ListAPIView):
    queryset = Inventory_Transaction.objects.all()
    serializer_class = InventoryTransactionSerializer

class CheckoutView(APIView):
    def post(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response({"error": "No items provided in cart."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Validation Loop
        validated_items = []
        for item in items:
            product_id = item.get('product_id')
            try:
                quantity = int(item.get('quantity', 0))
            except ValueError:
                return Response({"error": "Invalid quantity for product ID " + str(product_id)}, status=status.HTTP_400_BAD_REQUEST)

            if not product_id or quantity <= 0:
                return Response({"error": "Product ID and a positive quantity are required."}, status=status.HTTP_400_BAD_REQUEST)

            product = Product.objects.filter(Product_ID=product_id).first()
            if not product:
                return Response({"error": "Product ID " + str(product_id) + " not found."}, status=status.HTTP_404_NOT_FOUND)

            if product.Quantity_In_Stock < quantity:
                error_msg = "Insufficient stock for " + str(product.Product_Name) + ". Only " + str(product.Quantity_In_Stock) + " available."
                return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)
                
            validated_items.append({
                'product': product,
                'quantity': quantity
            })

        # 2. Execution Loop
        processed_count = 0
        for v_item in validated_items:
            product_obj = v_item['product']
            qty = v_item['quantity']

            product_obj.Quantity_In_Stock = product_obj.Quantity_In_Stock - qty
            product_obj.save()

            transaction_id = Inventory_Transaction.objects.count() + 1
            total_val = float(qty * product_obj.Price)
            transaction = Inventory_Transaction(
                Transaction_ID=transaction_id,
                Transaction_Type='OUT',
                Quantity=qty,
                Total_Value=total_val,
                Product=product_obj,
                Transaction_Date=timezone.now()
            )
            transaction.save()
            processed_count = processed_count + 1

        success_msg = "Successfully processed bill for " + str(processed_count) + " particular items."
        return Response({"message": success_msg}, status=status.HTTP_200_OK)
