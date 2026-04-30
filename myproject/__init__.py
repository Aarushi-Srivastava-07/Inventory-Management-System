import pymysql

pymysql.install_as_MySQLdb()

# This tricks Django 6.0 into accepting PyMySQL by faking the version number
pymysql.version_info = (2, 2, 8, "final", 0)