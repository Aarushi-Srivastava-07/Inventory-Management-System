from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/upload/', views.CSVUploadView.as_view(), name='csv-upload'),
    path('api/products/', views.ProductListView.as_view(), name='product-list'),
    path('api/suppliers/', views.SupplierListView.as_view(), name='supplier-list'),
    path('api/transactions/', views.TransactionListView.as_view(), name='transaction-list'),
    path('api/checkout/', views.CheckoutView.as_view(), name='checkout'),
]
