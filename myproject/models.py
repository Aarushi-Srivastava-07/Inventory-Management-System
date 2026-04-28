from django.db import models

class Supplier(models.Model):
    Supplier_ID = models.IntegerField(primary_key=True)
    Supplier_Name = models.CharField(max_length=100)
    Phone = models.CharField(max_length=15)
    Street = models.CharField(max_length=100)
    City = models.CharField(max_length=50)
    State = models.CharField(max_length=50)
    Pincode = models.CharField(max_length=10)

    def __str__(self):
        return str(self.Supplier_ID) + " - " + self.Supplier_Name

    class Meta:
        managed = False
        db_table = 'supplier'


class Product(models.Model):
    Product_ID = models.IntegerField(primary_key=True)
    Product_Name = models.CharField(max_length=100)
    Category = models.CharField(max_length=50)
    Price = models.DecimalField(max_digits=10, decimal_places=2)
    Quantity_In_Stock = models.IntegerField()
    Supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.Product_ID) + " - " + self.Product_Name

    class Meta:
        managed = False
        db_table = 'product'


class Inventory_Transaction(models.Model):
    TRANSACTION_CHOICES = [
        ('IN', 'IN'),
        ('OUT', 'OUT'),
    ]

    Transaction_ID = models.IntegerField(primary_key=True)
    Transaction_Type = models.CharField(max_length=10, choices=TRANSACTION_CHOICES)
    Quantity = models.IntegerField()
    Transaction_Date = models.DateField(auto_now_add=True)
    Total_Value = models.DecimalField(max_digits=10, decimal_places=2)
    Product = models.ForeignKey(Product, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.Transaction_ID) + " - " + self.Transaction_Type + " - " + str(self.Quantity)

    class Meta:
        managed = False
        db_table = 'inventory_transaction'
