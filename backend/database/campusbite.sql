-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: campusbite
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `favorite_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `item_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`favorite_id`),
  UNIQUE KEY `user_id` (`user_id`,`item_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
INSERT INTO `favorites` VALUES (10,4,2,'2026-11-11 13:56:19'),(17,3,2,'2026-11-11 14:10:05'),(18,3,1,'2026-11-11 14:10:18'),(21,3,4,'2026-11-11 14:17:51');
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `stall_id` int NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `category` enum('food','drink') NOT NULL,
  `availability` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`item_id`),
  KEY `stall_id` (`stall_id`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`stall_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES (1,1,'Small Ice Tea','Refreshing iced tea',15.00,'assets/img/menu/small-ice-tea.jpg','drink',1),(2,1,'Chicken Pops','Crispy chicken pops',85.00,'assets/img/menu/chicken-pops.jpg','food',1),(3,1,'Chicken Skin','Crispy chicken skin',90.00,'assets/img/menu/chicken-skin.jpg','food',1),(4,1,'BBQ Chicken Rice Bowl','Chicken barbecue served with rice',85.00,'assets/img/menu/bbq-chicken-rice-bowl.jpg','food',1),(8,3,'Beef Shawarma',NULL,85.00,'assets/img/menu/beef-shawarma.jpg','food',1),(9,3,'Shawarma Rice',NULL,90.00,'assets/img/menu/shawarma-rice.jpg','food',1),(10,3,'Calamansi Juice',NULL,20.00,'assets/img/menu/calamansi-juice.jpg','drink',1),(11,4,'Hungarian Sausage',NULL,90.00,'assets/img/menu/hungarian-sausage.jpg','food',1),(12,4,'Blue Lemonade',NULL,20.00,'assets/img/menu/blue-lemonade.jpg','drink',1);
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `order_id` (`order_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `menu_items` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,4,2,85.00),(2,2,1,1,15.00),(3,3,4,1,85.00),(4,4,4,1,85.00),(5,5,2,2,85.00),(6,5,1,2,15.00),(7,6,2,3,85.00),(8,6,1,2,15.00),(9,7,2,1,85.00),(10,7,1,1,15.00),(11,8,4,1,85.00),(12,8,2,1,85.00),(13,9,4,1,85.00),(14,9,3,1,90.00),(15,9,1,2,15.00),(16,10,1,2,15.00),(17,11,4,2,85.00),(18,11,1,1,15.00),(19,12,4,1,85.00),(20,12,3,1,90.00),(21,13,1,1,15.00),(22,14,1,1,15.00),(23,15,1,1,15.00),(24,15,3,1,90.00),(25,16,1,1,15.00),(26,16,3,1,90.00),(27,17,4,1,85.00),(28,17,2,1,85.00),(29,17,1,1,15.00),(30,18,4,1,85.00),(31,18,2,1,85.00),(32,18,1,1,15.00),(33,19,12,3,20.00),(34,19,11,1,90.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `stall_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','gcash') NOT NULL,
  `payment_status` enum('pending','verified','failed') DEFAULT 'pending',
  `order_status` enum('pending','accepted','preparing','ready','completed','rejected','cancelled','no_show') DEFAULT 'pending',
  `pickup_time` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ready_at` datetime DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `customer_id` (`customer_id`),
  KEY `stall_id` (`stall_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`stall_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,1,175.00,'gcash','pending','no_show',NULL,'2026-11-07 12:46:18',NULL),(2,1,1,20.00,'cash','pending','completed',NULL,'2026-11-07 13:00:05',NULL),(3,1,1,90.00,'cash','pending','no_show',NULL,'2026-11-07 13:08:49',NULL),(4,1,1,90.00,'cash','pending','completed',NULL,'2026-11-07 14:55:17',NULL),(5,1,1,205.00,'cash','pending','completed',NULL,'2026-11-07 15:23:50',NULL),(6,1,1,290.00,'cash','pending','no_show',NULL,'2026-11-07 15:29:42',NULL),(7,3,1,105.00,'cash','pending','completed',NULL,'2026-11-11 13:14:33',NULL),(8,4,1,175.00,'gcash','pending','pending',NULL,'2026-11-11 13:23:46',NULL),(9,4,1,210.00,'cash','pending','completed',NULL,'2026-11-11 13:24:04',NULL),(10,4,1,35.00,'cash','pending','pending',NULL,'2026-11-11 13:59:57',NULL),(11,3,1,190.00,'cash','pending','ready',NULL,'2026-11-11 14:18:08','2026-11-20 19:51:06'),(12,5,1,180.00,'cash','pending','pending',NULL,'2026-11-19 09:10:21',NULL),(13,5,1,20.00,'cash','pending','completed',NULL,'2026-11-19 09:10:33','2026-11-20 19:34:23'),(14,6,1,20.00,'cash','pending','completed',NULL,'2026-11-20 11:36:24','2026-11-20 19:37:10'),(15,6,1,110.00,'gcash','pending','completed',NULL,'2026-11-20 11:41:03','2026-11-20 19:41:24'),(16,6,1,110.00,'cash','pending','completed',NULL,'2026-11-20 11:51:33','2026-11-20 19:51:56'),(17,6,1,190.00,'cash','pending','completed',NULL,'2026-11-20 12:07:23','2026-11-20 20:07:39'),(18,6,1,190.00,'cash','pending','pending',NULL,'2026-11-20 12:08:38',NULL),(19,6,4,155.00,'cash','pending','ready',NULL,'2026-11-20 15:12:32','2026-11-20 23:13:12');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stalls`
--

DROP TABLE IF EXISTS `stalls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stalls` (
  `stall_id` int NOT NULL AUTO_INCREMENT,
  `stall_name` varchar(150) NOT NULL,
  `description` text,
  `logo` varchar(255) DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT '0.0',
  `status` enum('open','closed') DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`stall_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stalls`
--

LOCK TABLES `stalls` WRITE;
/*!40000 ALTER TABLE `stalls` DISABLE KEYS */;
INSERT INTO `stalls` VALUES (1,'Chicky Fryday',NULL,'assets/img/stalls/ChickyFrydayLogo.jpg',4.5,'open','2026-11-07 09:00:40'),(3,'Gulaman District',NULL,NULL,4.3,'open','2026-11-20 13:02:36'),(4,'Fresh&Up',NULL,NULL,4.3,'open','2026-11-20 13:07:27');
/*!40000 ALTER TABLE `stalls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('student','faculty','vendor') NOT NULL DEFAULT 'student',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `google_id` varchar(255) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `stall_id` int DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `google_id` (`google_id`),
  KEY `fk_users_stall` (`stall_id`),
  CONSTRAINT `fk_users_stall` FOREIGN KEY (`stall_id`) REFERENCES `stalls` (`stall_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Test Student','teststudent@my.xu.edu.ph',NULL,'student','2026-11-07 12:37:15',NULL,NULL,NULL),(2,'Chicky Fryday Vendor','chickyvendor@campusbite.com','scrypt:32768:8:1$J4YHBUcMdEU6nYbw$c714da034b55072686dbbfe7667344f19bade99de75e1ad4917434c4b62e780d03e0937fb1bc89f92cf027792a448ea3f59cb48fff2b6d3e929e713ecc5ddd4d','vendor','2026-11-07 13:27:47',NULL,NULL,1),(3,'Test Student','teststudent2@my.xu.edu.ph','scrypt:32768:8:1$QgSieSS8D2sX2lld$5b04d0a9a5502b91cc40b33c56a6332c0512c60f3e069b985a522d93fc10a02bb4c9a22c0143c5dfa6ba7041f9d9edcf540d83c308fb888ed3c2bcf457679dd0','student','2026-11-11 12:16:55',NULL,NULL,NULL),(4,'asd','john@my.xu.edu.ph','scrypt:32768:8:1$NT4d9oUs2i9kdlmV$b899a8d081992152b4c30e0af2623fea6b2744469ccd51cddfd2a07db7919e6449f38f163756656a69c5119d5923a1acbb3c75d10575d8ee4dfce999ce65074b','student','2026-11-11 13:23:22',NULL,NULL,NULL),(5,'john','john1@my.xu.edu.ph','scrypt:32768:8:1$6cIK5mCoPWeHjTUl$0f4d12dfae119a541507e2c58f366381ab7d253e22c20e875e1efd282abc039688d5aae06139f9164de096d2b681648279d87e53c19433e1a21100b90fe8a9a4','student','2026-11-19 09:09:41',NULL,NULL,NULL),(6,'jr','jr@my.xu.edu.ph','scrypt:32768:8:1$7DLGbiXnXa47CSD1$0ff9b4f0ad259927270507644f34c8153e2dbb90e21ffd4a8fc77eefb068f5f733eefceb85462285a257277b20e1d80f0b3bd25ed5fb2104cecc484bc0d5f89e','student','2026-11-20 11:36:07',NULL,NULL,NULL),(7,'gulamandistrictvendor','gulamandistrictvendor@campusbite.com','scrypt:32768:8:1$iIdsBpZKJ2ftQEqC$c1b8bbcc0f964927ad20001a5d079e8b271bab8dedea8b855365ed50ca11a446146d532971402b0f7302c1a1df48677af99910337b0bbff76a815d468fa24444','vendor','2026-11-20 14:49:02',NULL,NULL,3),(8,'fresh&upvendor','fresh&upvendor@campusbite.com','scrypt:32768:8:1$DkOajfTNsNWiBfO4$291c2c3eb463dd2f8982961996e1b316bedcde684714260a50b7d2f424ba966d36a5eb97b372d2a435b1b3eca75f2fe614962c30be1cdc571ed88649895cf189','vendor','2026-11-20 14:49:53',NULL,NULL,4);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-20 23:14:18
